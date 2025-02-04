import { NextFunction, Request, Response } from "express";

import { RateLimitConfig, RateLimitState } from "@typings/types/types";

/**
 * Rate limit middleware to control the number of requests a client can make to an endpoint within a specific time window.
 * It tracks requests based on the client's IP address and the requested endpoint URL.
 *
 * @param {RateLimitConfig} config - Configuration object that defines the rate limiting rules, including max requests, time window, and cooldown period.
 * @returns {Function} Express middleware function to handle rate limiting.
 * 
 */
export const rateLimit = (config: RateLimitConfig) => {
  const state: Record<string, RateLimitState> = {};
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.originalUrl}`;
    const now = Date.now();

    if (!state[key]) {
      state[key] = {
        requests: 0,
        lastRequest: 0,
      };
    }

    const endpointState = state[key];

    if (endpointState.cooldownUntil && now < endpointState.cooldownUntil) {
      res.setHeader("X-RateLimit-Limit", config.maxRequests.toString());
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", endpointState.cooldownUntil.toString());

      return res.status(429).json({
        error: "Too many requests. Please try again later.",
        cooldownUntil: endpointState.cooldownUntil,
      });
    }

    if (now - endpointState.lastRequest > config.windowMs) {
      endpointState.requests = 0;
    }

    endpointState.lastRequest = now;
    endpointState.requests += 1;

    res.setHeader("X-RateLimit-Limit", config.maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", (config.maxRequests - endpointState.requests).toString());
    res.setHeader("X-RateLimit-Reset", (now + config.windowMs).toString());
    if (endpointState.requests > config.maxRequests) {
      endpointState.cooldownUntil = now + config.cooldownMs;
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", endpointState.cooldownUntil.toString());

      return res.status(429).json({
        error: "Too many requests. Please try again later.",
        cooldownUntil: endpointState.cooldownUntil,
      });
    }
    next();
  };
};
