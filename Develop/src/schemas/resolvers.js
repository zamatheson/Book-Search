const { User, Book } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');
const { UniqueConstraintError } = require('sequelize');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                .select('-__v -password')
                .populate('books');
                return userData;
            }
            throw new AuthenticationError('Not logged in');
        }
    },

    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
    
            if (!user) {
                throw new AuthenticationError('This account has not been found.');
            }
    
            const passwordCheck = await user.isCorrectPassword(password);
            if (!passwordCheck) {
                throw new AuthenticationError('The password you have entered is not affiliated with this account.');
            }
            const token = signToken(user);
            return { token, user };
        },
        addUser: async (parent, args) => {
            try {
                const user = await User.create(args);
                const token = signToken(user);
                return { token, user };
            } catch (err) {
                if (err instanceof UniqueConstraintError) {
                    throw new AuthenticationError('The credentials you have entered are already associated with an account.');
                }
                throw new AuthenticationError('Your account cannot be created at this time.');
            }
        },
        saveBook: async (parent, { Book }, context) => {
            if (context.user) {
                try {
                    const updatedUser = await User.findOneAndUpdate(
                        { _id: context.user._id },
                        { $addToSet: { savedBooks: Book } },
                        { new: true }
                    );
                    return updatedUser;
                } catch (err) {
                    throw new AuthenticationError('Your book could not be saved at this time.');
                }
            } else {
                throw new AuthenticationError('Please login before saving a book.');
            }
        },
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } } },
                    { new: true }
                );
                return updatedUser;
            }
        }
    }
};
