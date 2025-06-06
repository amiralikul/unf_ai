import { ValidationError } from '../utils/errors.js';

// Validation middleware factory
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      let dataToValidate;
      
      switch (source) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        case 'headers':
          dataToValidate = req.headers;
          break;
        default:
          throw new Error(`Invalid validation source: ${source}`);
      }

      const result = schema.safeParse(dataToValidate);
      
      if (!result.success) {
        const errorDetails = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: err.received
        }));
        
        throw new ValidationError('Validation failed', errorDetails);
      }

      // Replace the original data with validated and transformed data
      switch (source) {
        case 'body':
          req.body = result.data;
          break;
        case 'query':
          req.query = result.data;
          break;
        case 'params':
          req.params = result.data;
          break;
        case 'headers':
          req.headers = result.data;
          break;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Convenience functions for common validation scenarios
export const validateBody = (schema) => validate(schema, 'body');
export const validateQuery = (schema) => validate(schema, 'query');
export const validateParams = (schema) => validate(schema, 'params');
export const validateHeaders = (schema) => validate(schema, 'headers');

// Middleware to validate multiple sources at once
export const validateMultiple = (validations) => {
  return (req, res, next) => {
    try {
      for (const { schema, source } of validations) {
        let dataToValidate;
        
        switch (source) {
          case 'body':
            dataToValidate = req.body;
            break;
          case 'query':
            dataToValidate = req.query;
            break;
          case 'params':
            dataToValidate = req.params;
            break;
          case 'headers':
            dataToValidate = req.headers;
            break;
          default:
            throw new Error(`Invalid validation source: ${source}`);
        }

        const result = schema.safeParse(dataToValidate);
        
        if (!result.success) {
          const errorDetails = result.error.errors.map(err => ({
            field: `${source}.${err.path.join('.')}`,
            message: err.message,
            code: err.code,
            received: err.received
          }));
          
          throw new ValidationError('Validation failed', errorDetails);
        }

        // Replace the original data with validated and transformed data
        switch (source) {
          case 'body':
            req.body = result.data;
            break;
          case 'query':
            req.query = result.data;
            break;
          case 'params':
            req.params = result.data;
            break;
          case 'headers':
            req.headers = result.data;
            break;
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
