import { AllExceptionsFilter } from '../http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
    let filter: AllExceptionsFilter;
    let mockResponse: any;
    let mockRequest: any;
    let mockArgumentsHost: any;

    beforeEach(() => {
        filter = new AllExceptionsFilter();
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockRequest = {
            url: '/test',
            method: 'GET',
        };
        mockArgumentsHost = {
            switchToHttp: jest.fn().mockReturnThis(),
            getResponse: jest.fn().mockReturnValue(mockResponse),
            getRequest: jest.fn().mockReturnValue(mockRequest),
        };
    });

    it('should format HttpException correctly', () => {
        const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

        filter.catch(exception, mockArgumentsHost as ArgumentsHost);

        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'Test error',
                path: '/test',
            }),
        );
    });

    it('should format unknown errors as 500', () => {
        const exception = new Error('Unknown error');

        filter.catch(exception, mockArgumentsHost as ArgumentsHost);

        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Internal server error',
            }),
        );
    });
});
