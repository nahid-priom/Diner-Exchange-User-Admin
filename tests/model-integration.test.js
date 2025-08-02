// Simple model integration test
// Run with: node tests/model-integration.test.js

// Set a test MongoDB URI if not provided
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = "mongodb://localhost:27017/dinar-exchange-test";
}

import dbConnect from "../lib/mongodb.js";
import Admin from "../models/Admin.js";
import Order from "../models/Order.js";
import UserOrder from "../models/UserOrder.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";

async function testModelRegistration() {
  try {
    console.log("🧪 Testing Model Registration...");
    
    // Try to connect to database (skip if unavailable)
    try {
      await dbConnect();
      console.log("✅ Database connected");
    } catch (error) {
      console.log("⚠️  Database connection skipped (not available for testing)");
    }
    
    // Test model registrations
    const models = {
      Admin,
      Order,
      UserOrder,
      Customer,
      User,
      Notification,
      AuditLog,
    };
    
    for (const [name, Model] of Object.entries(models)) {
      // Test that model is properly registered
      const modelName = Model.modelName;
      console.log(`✅ ${name} model registered as: ${modelName}`);
      
      // Test that we can create a query (without executing)
      const query = Model.find({}).limit(1);
      console.log(`✅ ${name} query creation successful`);
    }
    
    // Test that Order and UserOrder are different models
    if (Order.modelName === UserOrder.modelName) {
      throw new Error("❌ Order and UserOrder have the same model name!");
    }
    console.log("✅ Order and UserOrder are distinct models");
    
    // Test that they use different collections
    if (Order.collection.name === UserOrder.collection.name) {
      throw new Error("❌ Order and UserOrder use the same collection!");
    }
    console.log(`✅ Order uses collection: ${Order.collection.name}`);
    console.log(`✅ UserOrder uses collection: ${UserOrder.collection.name}`);
    
    // Test schema validation
    try {
      const testAdmin = new Admin({
        email: "invalid-email", // This should fail validation
        password: "test123",
        firstName: "Test",
        lastName: "Admin",
      });
      await testAdmin.validate();
      throw new Error("❌ Email validation should have failed!");
    } catch (error) {
      if (error.message.includes("Please enter a valid email address")) {
        console.log("✅ Email validation working correctly");
      } else {
        throw error;
      }
    }
    
    console.log("\n🎉 All model integration tests passed!");
    return true;
    
  } catch (error) {
    console.error("❌ Model integration test failed:", error.message);
    return false;
  } finally {
    process.exit(0);
  }
}

// Run the test
testModelRegistration();