/**
 * Created by Indexyz on 2017/4/10.
 */
"use strict";
/**
 * Created by Indexyz on 2017/4/7.
 */
const db = require("mongoose");
const userSchema = require("../../Db/Schema/User");
const userService = require("../../Db/Service/userService");

let userModel = db.model(require('../../Define/Db').Db.USER_DB, userSchema);


module.exports.get = (req, res, next) => {
    res.render("auth/login", {
        "info": req.query.info
    })
};

module.exports.post = (req, res, next) => {
    let email = req.body.email,
        password = req.body.password;

    if (!email || !password) { res.render("auth/login", {"e": "请填写全部的信息"}); return }

    userService.login(email, password, (err, doc) => {
        if (!doc) { return res.render("auth/login", {"e": "用户名或密码错误"}); }
        if (err) { return next(err); }
        req.session.user = doc;
        if (!req.query.redirect){
            res.redirect("/")
        } else {
            res.redirect(req.query.redirect)
        }
    });
};