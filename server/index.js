const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const config = require("./config/key");

mongoose.connect(config.mongoURI, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.once("open", () => {
  console.log("database successfully connected...");
});
mongoose.Promise = global.Promise;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const { User } = require("./models/user");
const { auth } = require("./middleware/auth");

app.get("/api/v1/user/auth", auth, (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    // isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    role: req.user.role,
    // image: req.user.image,
  });
});

app.post("/api/v1/user/register", (req, res) => {
  const user = new User(req.body);
  user.save((error, result) => {
    if (error) {
      return res.json({ success: false, error });
    } else {
      return res.status(200).json({ success: true });
    }
  });
});
app.post("/api/v1/user/login", (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user) {
      return res.json({
        success: false,
        message: "Authentication failed, email not found",
      });
    } else {
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (!isMatch) {
          return res.json({ success: false, message: "worng password" });
        } else {
          user.generateToken((err, user) => {
            if (err) {
              return res.status(400).send(err);
            } else {
              res.cookie("s_authExp", user.tokenExp);
              res.cookie("s_auth", user.token).status(200).json({
                success: true,
              });
            }
          });
        }
      });
    }
  });
});

app.get("/api/v1/user/logout", auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, doc) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({
      success: true,
    });
  });
});

app.get("/", (req, res) => {
  res.send("hello run for God");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("server started at " + 5000);
});
