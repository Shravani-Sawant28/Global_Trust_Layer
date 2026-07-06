'use strict';

/**
 * middleware/validateWallet.js
 *
 * Validates that route parameters and body fields that represent
 * Ethereum addresses are syntactically valid hex addresses.
 *
 * Usage:
 *   router.get('/:wallet', validateWalletParam('wallet'), handler)
 *   router.post('/', validateWalletBody(['clientWallet', 'freelancerWallet']), handler)
 */

const ETH_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

/**
 * Validate a single route :param as an Ethereum address.
 *
 * @param {string} paramName - name of the route parameter (e.g. 'wallet')
 * @returns Express middleware
 */
function validateWalletParam(paramName) {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!value || !ETH_ADDRESS_REGEX.test(value)) {
      const err = new Error(`Invalid Ethereum address in parameter: ${paramName}`);
      err.statusCode = 400;
      return next(err);
    }
    // Normalise to lowercase
    req.params[paramName] = value.toLowerCase();
    next();
  };
}

/**
 * Validate one or more body fields as Ethereum addresses.
 * Required fields must be present; optional fields are only validated if present.
 *
 * @param {string[]} requiredFields  - fields that must exist and be valid
 * @param {string[]} [optionalFields] - fields validated only when present
 * @returns Express middleware
 */
function validateWalletBody(requiredFields = [], optionalFields = []) {
  return (req, res, next) => {
    for (const field of requiredFields) {
      const value = req.body[field];
      if (!value) {
        const err = new Error(`Missing required field: ${field}`);
        err.statusCode = 400;
        return next(err);
      }
      if (!ETH_ADDRESS_REGEX.test(value)) {
        const err = new Error(`Invalid Ethereum address for field: ${field}`);
        err.statusCode = 400;
        return next(err);
      }
      req.body[field] = value.toLowerCase();
    }

    for (const field of optionalFields) {
      const value = req.body[field];
      if (value && !ETH_ADDRESS_REGEX.test(value)) {
        const err = new Error(`Invalid Ethereum address for optional field: ${field}`);
        err.statusCode = 400;
        return next(err);
      }
      if (value) req.body[field] = value.toLowerCase();
    }

    next();
  };
}

module.exports = { validateWalletParam, validateWalletBody };
