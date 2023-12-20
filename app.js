const express = require("express");
const app = express();
const userRouter = require("./routes/userRoutes");
const aiRouter = require("./routes/AIAPIRoutes");
const AppError = require("./utils/appError");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");
// const helmet = require('helmet');
// const mongoSanitize = require('express-mongo-sanitize');
// const rateLimit = require('express-rate-limit');
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use((req, res, next) => {
  next();
});
app.use("/api/v1/users", userRouter);
app.use("/api/v1/ai", aiRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`), 404);
});
app.use(express.static("public"));
app.use(cookieParser());
// app.use(helmet());
// app.use(mongoSanitize());
// app.use(xss());
// app.use(compression());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// const limiter = rateLimit({
//   max: 100,
//   windowMs: 60 * 60 * 1000,
//   message: 'Too many requests form this IP please try after an hour',
// });

module.exports = app;
