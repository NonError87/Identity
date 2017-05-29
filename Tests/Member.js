const should = require("should");
const request = require("supertest");
const db = require("mongoose");
const userSchema = require('../Db/Schema/User');
const appSchema = require('../Db/Schema/Application');
const userAuthSchema = require('../Db/Schema/UserAuth');
const DbDefine = require('../Define/Db');
const stringLib = require('../Utils/String');
const Tsession = require('supertest-session');

let application = require("../App"),
    userModel = db.model(DbDefine.Db.USER_DB, userSchema),
    appModel = db.model(DbDefine.Db.APPS_DB, appSchema),
    userAuthModel = db.model(DbDefine.Db.APP_USER_DB, userAuthSchema);


describe("Member", function(){
    var user, password, agent, session;
    before(function(done){
        session = Tsession(application);
        password = stringLib.randomString(16)
        user = new userModel({
            username: stringLib.randomString(8),
            password: password,
            email: "test@email.com"
        })
        user.generatorID();
        user.refresh();
        user.refreshSession();
        user.save(err => {
            if (err) return done(err);
            session.post('/auth/login')
                   .send({
                        username: user.username,
                        password: password
                    })
                   .expect(302)
                   .end(function(err, res){
                        if(err) return done(err);
                        done();
                    });
        });
    })

    it("get member", function(done){
        session.get("/member")
               .expect(200)
               .end(done);
    })
    
    it("get with none-auth", function(done){
        request(application)
            .get("/member")
            .expect(302)
            .end(done);
    })

    it("get profile", function(done){
        session.get("/member/profile")
               .expect(200)
               .end(done);
    })
    
    it("reset user-profile in profile", function(done){
        session.post("/member/profile")
               .send({
                   type: "resetUserKey"
               })
               .expect(200)
               .end(function(err, res){
                   if (err) { return done(err); }
                    userModel.findOne({
                        _id: user._id
                    }, (err, doc) => {
                        if (err) { return done(err); }
                        doc.profile.authToken.should.not.equal(user.profile.authToken);
                        user = doc;
                        done();
                    });
               });
    })

    it("set username in profile page", function(done){
        let randomUsername = stringLib.randomString(16);

        session.post("/member/profile")
               .send({
                   type: "changeUserName",
                   username: randomUsername
               })
               .expect(200)
               .end(function(err, res){
                   if (err) { return done(err) }
                   userModel.findOne({
                       username: randomUsername
                   }, (err, doc) => {
                       if (err) { return done(err); }
                       doc.username.should.equal(randomUsername);
                       user = doc;
                       done();
                   });
               });
    })

    it("get skin", function(done){
        session.get("/member/skin")
               .expect(200)
               .end(done);
    })

    it("test upload skin", function(done){
        session.post("/member/skin/skin")
               .field("isSlim", "off")
               .attach('uploadSkin', 'Tests/Resources/test-skin.png')
               .expect(302)
               .end(function(err, res){
                   if (err) return done(err);
                   res.text.should.equal("Found. Redirecting to /member/skin?succ=1")
                   userModel.findOne({
                       _id: user._id
                   }, (err, doc) => {
                       doc.skin.skin.should.be.ok();
                       doc.skin.skin.toString().length.should.be.equal(24);
                       done();
                   });
               });
    })

    it("test upload skin slim", function(done){
        session.post("/member/skin/skin")
               .field("isSlim", "on")
               .attach('uploadSkin', 'Tests/Resources/test-skin.png')
               .expect(302)
               .end(function(err, res){
                   if (err) return done(err);
                   res.text.should.equal("Found. Redirecting to /member/skin?succ=1")
                   userModel.findOne({
                       _id: user._id
                   }, (err, doc) => {
                       if (err) return done(err);
                       doc.skin.slim.should.be.ok();
                       doc.skin.slim.toString().length.should.equal(24)
                       user = doc;
                       return done();
                   });
               });
    })

    it("test upload cap", function(done){
        session.post("/member/skin/cap")
               .send({ isSlim: "off" })
               .attach('uploadCup', 'Tests/Resources/test-cap.png')
               .expect(302)
               .end(function(err, res){
                   if (err) return done(err);
                   res.text.should.equal("Found. Redirecting to /member/skin?succ=1");
                   done();
               });
    })

    it("get user skin", function(done){
        session.get("/member/skin/skin")
               .expect(302)
               .end(done);
    })

    it("test application page", function(done){
        session.get("/member/apps").expect(200).end(done);
    })

    it("test application create page", function(done){
        session.get("/member/apps/new").expect(200).end(done);
    })

    describe("application", function(){
        var app , appname;
        before(function(done){
            this.timeout(6000);
            // create application
            appname = stringLib.randomString(16);
            session.post("/member/apps/new")
                   .send({
                       appname: appname
                   })
                   .expect(302)
                   .end(function(err, doc){
                        appModel.findOne({
                            name: appname
                        }, (err, doc) => {
                            if (err) return done(err);
                            doc.should.be.ok();
                            app = doc;
                            return done();
                        });
                   });
        })

        it("create dump", function(done){
            session.post("/member/apps/new")
                   .send({
                       appname: appname
                   })
                   .expect(200)
                   .end(done);
        })

        it("edit application page", function(done){
            session.get("/member/apps/edit/" + app._id)
                   .expect(200)
                   .end(done);
        })

        it("test edit application", function(done){
            // gen new appname
            appname = stringLib.randomString(16);
            session.post("/member/apps/edit/" + app._id)
                   .field("appname", appname)
                   .field("get-login", "on")
                   .expect(302)
                   .end(function(err, res){
                       if (err) return done(err);
                       appModel.findOne({
                           name: appname
                       }, (err, doc) => {
                           if (err) return done(err);
                           doc.should.be.ok();
                           doc.name.should.equal(appname);
                           doc.scope.should.containEql("get-login")
                           
                           app = doc;
                           return done();
                       })
                   });
                
        })

        it("test edit application with icon file", function(done){
            // gen new appname
            appname = stringLib.randomString(16);
            session.post("/member/apps/edit/" + app._id)
                   .field("appname", appname)
                   .field("get-login", "on")
                   .attach('uploadLogo', 'Tests/Resources/test-icon.png')
                   .expect(302)
                   .end(function(err, res){
                       if (err) return done(err);
                       appModel.findOne({
                           name: appname
                       }, (err, doc) => {
                           if (err) return done(err);
                           doc.should.be.ok();
                           doc.name.should.equal(appname);
                           doc.scope.should.containEql("get-login");
                           doc.image.should.not.be.null();

                           app = doc;
                           return done();
                       });
                   });
        })

        it("oauth give authorize application", function(done){
            session.post("/oauth/authorize?response_type=code&client_id=" + app.client_id)
                   .send({
                       "get-login": "on"
                   })
                   .expect(302)
                   .end(function(err, doc){
                       userAuthModel.findOne({
                            app: app._id,
                            user: user._id
                        }, (err, doc) => {
                            if (err) return done(err);
                            should.exist(doc);
                            done();
                        });
                   });
        })
        
        it("get info", function(done){
            session.get("/member/apps").expect(200).end(function(err, res){
                if (err) return done(err);
                res.text.indexOf(appname).should.not.equal(-1);
                return done();
            })
        })

        it("cancel application", function(done){
            session.get("/member/apps/cancel/" + app._id)
                   .expect(302)
                   .end(function(err, doc){
                        userAuthModel.findOne({
                            app: app._id,
                            user: user._id
                        }, (err, doc) => {
                            if (err) return done(err);
                            should.not.exist(doc);
                            done();
                        })
                   })
        })

        after(function(done){
            session.get("/member/apps/remove/" + app._id)
               .expect(302)
               .end(done);
        })
    })

    after(function(done){
        userModel.remove({
            _id: user._id
        }, err => {
            if (err) return done(err);
            done();
        })
    })
})