# DOTS Core Framework Documentation

## Overview

DOTS Core is a modular, TypeScript-based framework for building server-side applications with a focus on dependency injection, middleware, and MVC patterns. It provides a structured approach to application development similar to ASP.NET Core.

## Table of Contents

1. [Getting Started](./getting-started.md)
2. [Core Concepts](./core-concepts.md)
3. [Component Documentation](#component-documentation)
4. [API Reference](./api-reference.md)

## Component Documentation

- [Hosting](./components/hosting.md) - Application lifecycle, startup, and hosting environment
- [Dependency Injection](./components/dependency-injection.md) - Service registration and resolution
- [Configuration](./components/configuration.md) - Managing application settings
- [Middleware](./components/middleware.md) - Request processing pipeline
- [Routing](./components/routing.md) - URL pattern matching and request handling
- [MVC](./components/mvc.md) - Model-View-Controller pattern implementation
- [Database](./components/database.md) - Database connectivity and ORM integration
- [Logging](./components/logging.md) - Application logging and diagnostics
- [Health Checks](./components/health-checks.md) - Application health monitoring

## Architecture

The DOTS Core framework follows a modular architecture with clear separation of concerns. It is designed to be extensible, allowing developers to replace or customize individual components without affecting the rest of the application.

```
┌─────────────────────────────────────────────────────┐
│                    Application                       │
├───────────┬───────────┬────────────┬────────────────┤
│  Hosting  │    MVC    │  Routing   │   Middleware   │
├───────────┼───────────┼────────────┼────────────────┤
│    DI     │   Config  │  Logging   │ Health Checks  │
├───────────┴───────────┴────────────┴────────────────┤
│                   HTTP Layer                         │
└─────────────────────────────────────────────────────┘
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
