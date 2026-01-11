export const mockFirebaseAdmin = {
    auth: jest.fn().mockReturnValue({
        verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-uid', email: 'test@example.com' }),
    }),
};

export const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
};

export const mockProductModel = {
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    db: {
        model: jest.fn().mockReturnValue(mockUserModel),
    },
};
