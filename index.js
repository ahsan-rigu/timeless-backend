const express = require("express");
const dotenv = require("dotenv");
const Razorpay = require("razorpay");
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
  estimatedDeliveryTime: Number,
  reviews: Array,
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

const NavDataSchema = new mongoose.Schema({
  gender: String,
  title: String,
  description: String,
  image: String,
  categories: Array,
});

const NavData = mongoose.model("NavData", NavDataSchema);

const UserSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    wishlistItems: Array,
    cartItems: Array,
    addresses: Array,
    preferences: Object,
    orders: Array,
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

app.listen(8080, () => {
  console.log("Listening on port 8080 as well");
});

app.get("/nav-data", async (req, res) => {
  try {
    const navData = await NavData.find({});

    res.status(200).send({
      navData,
    });
  } catch (error) {
    res.status(404).send(error);
  }
});

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.send({
      products,
    });
  } catch (error) {
    res.status(404).send(error);
  }
});

app.get("/featured", async (req, res) => {
  try {
    const featuredData = await HomepageGrid.find({});
    res.send({
      featuredData,
    });
  } catch (error) {
    res.status(404).send(error);
  }
});

const getUserById = async (_id) => {
  try {
    const user = await User.findOne({ _id });
    const stringID = User._id.toString();
    return stringID;
  } catch {
    res.status(404).send(error);
  }
};

app.get("/authorize-token", async (req, res) => {
  console.log("initialized auth verification");
  if (req.headers.authorization) {
    const token = req.headers.authorization.split("Bearer ")[1];
    jwt.verify(token, process.env.JWT_KEY, async (error, decodedToken) => {
      if (!error) {
        if (decodedToken !== undefined) {
          try {
            const user = await User.findOne({ _id: decodedToken.id });
            res.sendStatus(200);
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
    res.status(401).send({ message: "No Token" });
  }
});

app.post("/sign-in", bodyParser.json(), async (req, res) => {
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
          res.status(200).send({ message: "Logged In", token });
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(401).send({ message: "email and password dont match" });
  }
});

app.get("/fetch-user", async (req, res) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split("Bearer ")[1];
    jwt.verify(token, process.env.JWT_KEY, async (error, decodedToken) => {
      if (!error) {
        if (decodedToken !== undefined) {
          try {
            const user = await User.findOne({ _id: decodedToken.id });
            res.status(200).send({ user });
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

app.post("/sign-up", bodyParser.json(), async (req, res) => {
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
    res.status(401).send({ message: "No Token" });
  }
});

app.post("/deleteUser", bodyParser.json(), async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password, "heoolo");
  try {
    await User.deleteOne({ email, password });
    res.sendStatus(202);
  } catch (error) {
    res.sendStatus(401);
  }
});

app.post("/changePassword", bodyParser.json(), async (req, res) => {
  const { email, password, newPassword } = req.body;
  try {
    await User.updateOne({ email, password }, { password: newPassword });
    res.sendStatus(202);
  } catch (error) {
    res.status(401).send(error);
  }
});

app.post("/updateUser", bodyParser.json(), async (req, res) => {
  const { _id, wishlistItems, cartItems, addresses, orders } = req.body;
  console.log("user Update");
  try {
    await User.updateOne(
      { _id },
      { wishlistItems, cartItems, addresses, orders }
    );
    res.sendStatus(202);
  } catch (error) {
    res.status(401).send(error);
  }
});

const authorizedEmails = ["ahsanrigu@icloud.com"];

app.post("/review", bodyParser.json(), async (req, res) => {
  const { _id, email, name, rating, review } = req.body;
  console.log(req.body);
  try {
    //isreviewed true??
    if (authorizedEmails.includes(email)) {
      const res = await Product.updateOne(
        { _id },
        { $push: { reviews: { email, name, rating, review } } }
      );
    }
    res.sendStatus(202);
  } catch (error) {
    res.send(error);
  }
});

app.post("/placeOrder", bodyParser.json(), async (req, res) => {
  const { email, order } = req.body;
  try {
    const user = await User.updateOne({ email }, { $push: { orders: order } });
    const user2 = await User.updateOne({ email }, { cartItems: [] });
    try {
      for (product of order) {
        const { quantity } = await Product.findOne({ _id: product._id });
        if (quantity - product.quantity < 0) quantity = product.quantity;
        const res = await Product.updateOne(
          { _id: product._id },
          { quantity: quantity - product.quantity }
        );
      }
    } catch {
      //if updation call fails i dont care
      res.sendStatus(202);
    }
    res.sendStatus(202);
  } catch (error) {
    res.send(error);
  }
});

//razerpay

const paymentSchema = new mongoose.Schema({
  razorpay_order_id: {
    type: String,
    required: true,
  },
  razorpay_payment_id: {
    type: String,
    required: true,
  },
  razorpay_signature: {
    type: String,
    required: true,
  },
});

const Payment = mongoose.model("Payment", paymentSchema);

const instance = new Razorpay({
  key_id: process.env.RZPAY_KEY,
  key_secret: process.env.RZPAY_SECRET,
});

app.post("/verifyPayment", bodyParser.json(), async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RZPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;
  if (isAuthentic) {
    await Payment.create({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    res.sendStatus(200);
  } else {
    res.status(400).json({
      success: false,
    });
  }
});

app.get("*", async (req, res) => {
  console.log("someone trying to access");
  res.send("HELLO YOUR REQUEST HAS BEEN HEARD");
});

app.use("*", (req, res) => {
  res.sendStatus(404);
});
