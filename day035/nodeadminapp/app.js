require("dotenv").config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session");
var sequelize = require("./models/index").sequelize;

var session = require("express-session");
const redis = require("redis");
let RedisStore = require("connect-redis")(session);

let redisClient = redis.createClient({
	host: "127.0.0.1",
	port: 6379,
	db: 0,
	password: "GYzz001020!!",
});

var passport = require("passport");
const passportConfig = require("./passport/index.js");

//일회성(휘발성) 데이터를 특정 페이지(뷰)에 전달하는 방식제공 플래시 팩키지참조하기
var flash = require("connect-flash");

//express-ejs-layouts 패키지 참조하기
var expressLayouts = require("express-ejs-layouts");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var articleRouter = require("./routes/article");
var articleAPIRouter = require("./routes/articleAPI");
var adminRouter = require("./routes/admin");

var app = express();
// 이 위치 중요! 가장 위에
app.use(flash());

//mysql과 자동연결처리 및 모델기반 물리 테이블 생성처리제공
sequelize.sync();

//passport 모듈을 이용한 로그인 인증처리
passportConfig(passport);

// app.use(
// 	session({
// 		resave: false,
// 		saveUninitialized: true,
// 		secret: process.env.COOKIE_SECRET,
// 		cookie: {
// 			httpOnly: true,
// 			secure: false,
// 			maxAge: 1000 * 60 * 20, //5분동안 서버세션을 유지하겠다.(1000은 1초)
// 		},
// 	})
// );

app.use(
	session({
		store: new RedisStore({ client: redisClient }),
		saveUninitialized: true,
		secret: "moiin",
		resave: false,
		cookie: {
			httpOnly: true,
			secure: false,
			//maxAge : 3600000, 세션유지 시간설정 : 1 시간
		},
		ttl: 250, //Redis DB 에서 세션정보가 사라지게 할지에 대한 만료시간설정
		token: process.env.COOKIE_SECRET,
	})
);

// 패스포트 세선 초기화
app.use(passport.initialize());
// 패스포트 세션을 사용
app.use(passport.session());

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//레이아웃 설정
app.set("layout", "layout.ejs"); // 해당 노드앱의 모든 (콘텐츠)뷰파일의 기본 레이아웃ejs파일 설정하기
app.set("layout extractScripts", true); //콘텐츠페이지내 script태그를 레이아웃에 통합할지여부
app.set("layout extractStyles", true); //콘텐츠페이지내 style태그를 레이아웃에 통합할지여부
app.set("layout extractMetas", true); //콘텐츠페이지내 meta 태그를 레이아웃에 통합할지여부
app.use(expressLayouts);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/article", articleRouter);
app.use("/api/article", articleAPIRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render("error");
});

module.exports = app;
