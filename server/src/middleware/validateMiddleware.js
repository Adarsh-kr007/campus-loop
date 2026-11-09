import { matchedData, validationResult } from 'express-validator'
import { failure } from '../utils/apiResponse.js'

export function validateRequest(req, res, next) {
  const result = validationResult(req)
  if (!result.isEmpty()) {
    return failure(res, 'Validation failed', 400, result.array({ onlyFirstError: true }).map(({ path, param, msg }) => ({ field: path || param, message: msg })))
  }
  next()
}

export function bodyData(req) { return matchedData(req, { locations: ['body'], includeOptionals: true }) }
export function queryData(req) { return matchedData(req, { locations: ['query'], includeOptionals: true }) }

export function validatePlainQuery(req, res, next) {
  const bad = Object.entries(req.query).find(([, value]) => typeof value !== 'string')
  if (bad) return failure(res, `Query parameter "${bad[0]}" must be a single string`, 400)
  next()
}
