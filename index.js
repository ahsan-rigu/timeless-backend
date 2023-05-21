const express = require("express");
const dotenv = require("dotenv");
let cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

dotenv.config({ path: "./.env" });

const app = express();
app.use(cors());

mongoose.connect(process.env.URI);

const productSchema = new mongoose.Schema({
  id: Number,
  brand: String,
  name: String,
  images: Array,
  price: Number,
  rating: Number,
  category: String,
  gender: String,
  description: String,
  features: Array,
  quantity: Number,
  discount: Number,
  estimatedDeliveryTime: String,
});

const Product = mongoose.model("Product", productSchema);

const homepageGridSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  color: String,
  products: Array,
});

const HomepageGrid = mongoose.model("HomepageGrid", homepageGridSchema);

const hopepageSlideSchema = new mongoose.Schema({
  title: String,
  description: String,
  button: String,
  image: String,
  color: String,
});

const HomepageSlide = mongoose.model("HomepageSlide", hopepageSlideSchema);

const UserSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    wishlistItems: Array,
    cartItems: Array,
    addresses: Array,
    preferences: Object,
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

app.listen(8080, () => {
  console.log("Listening on port 8080 as well");
});

app.get("/sitedata", async (req, res) => {
  try {
    const products = await Product.find({});
    const homepageGrids = await HomepageGrid.find({});
    const homepageSlides = await HomepageSlide.find({});

    res.status(200).send({
      status: 200,
      message: "Data Fetched Successfully",
      data: { products, homepageGrids, homepageSlides },
    });
  } catch (error) {
    console.log("lalal");
    res.send(error);
  }
});

const getUserById = async (_id) => {
  try {
    const user = await User.findOne({ _id });
    const stringID = User._id.toString();
    return stringID;
  } catch {
    //user not found...
  }
};

app.get("/authorize", async (req, res) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split("Bearer ")[1];
    jwt.verify(token, process.env.JWT_KEY, async (error, decodedToken) => {
      if (!error) {
        if (decodedToken !== undefined) {
          try {
            const user = await User.findOne({ _id: decodedToken.id });
            res.status(200).send(user);
          } catch (error) {
            res.status(401).send({ message: "Token validiation error" });
          }
        } else {
          res.status(401).send({ message: "Token validiation error" });
        }
      } else {
        if (jwt.TokenExpiredError) {
          res.status(401).send({ message: "Token Expired" });
        } else {
          res.status(401).send({ message: "Invalid Token" });
        }
      }
    });
  } else {
    res.send({ status: 401, message: "No Token" });
  }
});

app.post("/authenticate", bodyParser.json(), async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" },
      (error, token) => {
        if (error) {
          console.log(error);
          res.status(500).send({ message: "Token Generation Failed" });
        } else {
          res.status(200).send({ message: "Logged In", token, user });
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(401).send({ message: "email and password dont match" });
  }
});

app.post("/register", bodyParser.json(), async (req, res) => {
  const {
    name,
    email,
    password,
    wishlistItems,
    cartItems,
    addresses,
    preferences,
  } = req.body;
  try {
    await User.create({
      name,
      email,
      password,
      wishlistItems,
      cartItems,
      addresses,
      preferences,
    });
    res.sendStatus(201);
  } catch (error) {
    res.send(error);
  }
});

app.post("/deleteUser", bodyParser.json(), async (req, res) => {
  const { _id } = req.body;
  try {
    await User.deleteOne({ _id });
    res.status(202);
  } catch (error) {
    res.send(error);
  }
});

app.post("/updateUser", bodyParser.json(), async (req, res) => {
  const { _id, wishlistItems, cartItems } = req.body;
  try {
    await User.updateOne({ _id }, { wishlistItems, cartItems });
    res.sendStatus(202);
  } catch (error) {
    res.send(error);
  }
});

app.use("*", (req, res) => {
  res.sendStatus(404);
});
