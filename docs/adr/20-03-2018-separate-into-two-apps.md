# 1. Separate into two web applications

Date: 20-03-2018

## Status

Accepted

## Context

We need to separate our API from our presentation layer (frontend).

## Decision

To do this, we will create two separate web applications. One will host our Web API
and the other will be the TorontoTrade website.

## Consequences

This will lead to a significant amount of refactoring and restructuring. The benefits
will be a simpler project that allows for easier modification and access along with
the separation between the presentation layer and the business logic.