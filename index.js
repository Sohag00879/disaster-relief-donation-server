const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("assignment");
    const collection = db.collection("users");
    const donations = db.collection("donations");
    const userDonation = db.collection("user-donation");
    const userComments = db.collection("user-comments");
    const testimonials = db.collection("testimonials");
    const volunteers = db.collection("volunteers");
    const switchs = db.collection("switch");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, name: user.name },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.EXPIRES_IN,
        }
      );

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
    // WRITE YOUR CODE HERE
    // ==============================================================
    //create donation post
    app.post("/api/v1/create-donation", async (req, res) => {
      await donations.insertOne(req.body);
      res.status(201).json({
        success: true,
        message: "Post Created Successfully",
      });
    });

    //get all donations

    app.get("/api/v1/donations", async (req, res) => {
      try {
        const data = await donations.find({}).toArray();
        res.status(200).json({
          success: true,
          message: "Successfully fetched",
          data,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    });

    app.get("/api/v1/single-donation/:id", async (req, res) => {
      const { id } = req.params;
      const data = await donations.findOne({ _id: new ObjectId(id) });
      res.status(200).json({
        success: true,
        message: "Successfully fetched One",
        data,
      });
    });

    app.post("/api/v1/edit-donation/:id", async (req, res) => {
      const { id } = req.params;
      await donations.updateOne({ _id: new ObjectId(id) }, { $set: req.body });
      res.status(200).json({
        success: true,
        message: "Successfully Updated",
      });
    });

    app.delete("/api/v1/delete-donation/:id", async (req, res) => {
      const { id } = req.params;
      const result = await donations.deleteOne({ _id: new ObjectId(id) });
      res.status(200).json({
        success: true,
        message: "Successfully deleted",
      });
    });

    app.get("/api/v1/user-donation", async (req, res) => {
      const data = await userDonation.find({}).toArray();
      res.status(200).json({
        success: true,
        message: "Successfully fetched",
        data,
      });
    });

    //user donation

    app.put("/api/v1/user-donation/:id", async (req, res) => {
      const { id } = req.params;
      const data = await donations.findOne({ _id: new ObjectId(id) });
      const { name, email, donationAmount } = req.body;
      const totalDonationAmount =
        Number(data?.totalDonationAmount) + Number(donationAmount);
      await donations.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: { totalDonationAmount },
          $push: {
            donations: { name, email, donationAmount },
          },
        }
      );
      res.status(201).json({
        success: true,
        message: "Donated Successfully",
      });
    });

    //comments
    app.post("/api/v1/create-comments", async (req, res) => {
      const currentTime = Date.now();
      const data = req.body;
      data.time = currentTime;
      await userComments.insertOne(data);
      res.status(201).json({
        success: true,
        message: "Comment Posted",
      });
    });

    app.get("/api/v1/get-comments", async (req, res) => {
      const data = await userComments.find({}).toArray();
      res.status(200).json({
        success: true,
        message: "Comments are fetched successfully",
        data,
      });
    });

    //testimonial
    app.post("/api/v1/create-testimonials", async (req, res) => {
      await testimonials.insertOne(req.body);
      res.status(201).json({
        success: true,
        message: "Testimonial Posted",
      });
    });

    app.get("/api/v1/get-testimonials", async (req, res) => {
      const data = await testimonials.find({}).toArray();
      res.status(200).json({
        success: true,
        message: "Testimonials are fetched successfully",
        data,
      });
    });

    //volunteer

    app.post("/api/v1/create-volunteers", async (req, res) => {
      await volunteers.insertOne(req.body);
      res.status(201).json({
        success: true,
        message: "Created Successfully",
      });
    });

    app.get("/api/v1/get-volunteers", async (req, res) => {
      const data = await volunteers.find({}).toArray();
      res.status(200).json({
        success: true,
        message: "Testimonials are fetched successfully",
        data,
      });
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
