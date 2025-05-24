# Database Integration

DOTS Core provides database integration capabilities, with a focus on MongoDB integration through Mongoose. The framework abstracts database connections and operations, making it easier to work with databases in your application.

## MongoDB Integration

### IMongoConnectionService

The `IMongoConnectionService` interface provides methods for managing MongoDB connections:

```typescript
interface IMongoConnectionService {
  /**
   * Connects to MongoDB using the provided options
   * @returns Promise resolving when connection is established
   */
  connect(): Promise<void>;
  
  /**
   * Disconnects from MongoDB
   * @returns Promise resolving when disconnection is complete
   */
  disconnect(): Promise<void>;
  
  /**
   * Gets the current Mongoose instance
   * @returns The mongoose instance or undefined if not connected
   */
  getMongooseInstance(): typeof mongoose | undefined;
}
```

### MongoConnectionService

The `MongoConnectionService` class implements the `IMongoConnectionService` interface and provides MongoDB connection management:

```typescript
class MongoConnectionService implements IMongoConnectionService {
  constructor(options: MongoConnectionOptions) {
    this.options = options;
  }
  
  async connect(): Promise<void> {
    // Connect to MongoDB
  }
  
  async disconnect(): Promise<void> {
    // Disconnect from MongoDB
  }
  
  getMongooseInstance(): typeof mongoose | undefined {
    return this.mongooseInstance;
  }
}
```

### MongoConnectionOptions

The `MongoConnectionOptions` interface defines the options for connecting to MongoDB:

```typescript
interface MongoConnectionOptions {
  /**
   * MongoDB connection URI
   */
  uri: string;
  
  /**
   * Mongoose connection options
   */
  options?: mongoose.ConnectOptions;
}
```

## Integration with Dependency Injection

MongoDB services are integrated with the DOTS Core dependency injection system:

```typescript
// Register MongoDB services
hostBuilder.configureServices((services) => {
  // Register connection service
  services.addSingleton("IMongoConnectionService", (provider) => {
    const config = provider.getRequiredService("IConfiguration");
    return new MongoConnectionService({
      uri: config.get("database:mongoUri"),
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    });
  });
  
  // Register repositories
  services.addScoped("IUserRepository", MongoUserRepository);
  services.addScoped("IProductRepository", MongoProductRepository);
});
```

## MongoDB as a Hosted Service

MongoDB connection can be managed as a hosted service to ensure proper connection lifecycle:

```typescript
class MongoDbHostedService implements IHostedService {
  constructor(private mongoService: IMongoConnectionService) {}
  
  async start(): Promise<void> {
    // Connect to MongoDB when the application starts
    await this.mongoService.connect();
  }
  
  async stop(): Promise<void> {
    // Disconnect from MongoDB when the application stops
    await this.mongoService.disconnect();
  }
}

// Register the hosted service
hostBuilder.configureServices((services) => {
  services.addHostedService(MongoDbHostedService);
});
```

## Working with Mongoose Models

DOTS Core provides types for working with Mongoose models:

```typescript
interface IMongooseModel<T extends mongoose.Document> extends mongoose.Model<T> {
  // Additional methods or properties specific to your application
}

// Example user model
interface UserDocument extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create a model
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserModel: IMongooseModel<UserDocument> = mongoose.model<UserDocument>(
  "User", 
  UserSchema
);
```

## Repository Pattern

DOTS Core encourages the use of the repository pattern to abstract database operations:

```typescript
// Repository interface
interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  create(user: UserDto): Promise<User>;
  update(id: string, user: UserDto): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

// MongoDB implementation
class MongoUserRepository implements IUserRepository {
  constructor(private mongoService: IMongoConnectionService) {}
  
  async findAll(): Promise<User[]> {
    const instance = this.mongoService.getMongooseInstance();
    if (!instance) {
      throw new Error("MongoDB is not connected");
    }
    
    const UserModel = instance.model<UserDocument>("User");
    const documents = await UserModel.find().exec();
    return documents.map(doc => this.mapToUser(doc));
  }
  
  async findById(id: string): Promise<User | null> {
    const instance = this.mongoService.getMongooseInstance();
    if (!instance) {
      throw new Error("MongoDB is not connected");
    }
    
    const UserModel = instance.model<UserDocument>("User");
    const document = await UserModel.findById(id).exec();
    return document ? this.mapToUser(document) : null;
  }
  
  // Implementation of other methods...
  
  private mapToUser(document: UserDocument): User {
    return {
      id: document._id.toString(),
      username: document.username,
      email: document.email,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    };
  }
}
```

## Error Handling

DOTS Core provides robust error handling for database operations:

```typescript
try {
  await this.mongoService.connect();
} catch (error) {
  this.logger.error("Failed to connect to MongoDB", error);
  throw new DatabaseConnectionError("Could not establish database connection", error);
}
```

## Transaction Support

For databases that support transactions, DOTS Core provides transaction helpers:

```typescript
async function createUserWithProfile(userData: UserDto, profileData: ProfileDto): Promise<User> {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const user = await UserModel.create([userData], { session });
    const profile = await ProfileModel.create([{ ...profileData, userId: user[0]._id }], { session });
    
    await session.commitTransaction();
    session.endSession();
    
    return this.mapToUser(user[0]);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}
```

## Configuration

Database configuration is typically managed through the application's configuration system:

```typescript
// Configuration in appsettings.json
{
  "database": {
    "mongoUri": "mongodb://localhost:27017/myapp",
    "options": {
      "useNewUrlParser": true,
      "useUnifiedTopology": true,
      "poolSize": 10,
      "connectTimeoutMS": 5000
    }
  }
}

// Using the configuration
const config = provider.getRequiredService("IConfiguration");
const mongoOptions: MongoConnectionOptions = {
  uri: config.get("database:mongoUri"),
  options: config.get("database:options")
};
```

This module provides a flexible and robust database integration layer for DOTS Core applications, with a focus on MongoDB but extensible to other database systems.
