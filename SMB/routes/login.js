var express = require('express');
var router = express.Router();
var db = require('../database');
var pwHash = require('password-hash')
const crypto = require("crypto");
const e = require('express');

/* GET users listing. */
router.get('/sign', function(req, res, next) {
  res.render('login', { title: 'Express' });
});

router.post('/create',function(req,res,next){
  const userCreds = req.body;

  var email = userCreds.useremail
  var hashedPw = pwHash.generate(userCreds.userpassword);
  var randomID = crypto.randomBytes(10).toString("hex");

  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 4096,
  });

  const pubKey = publicKey.export({ type: 'pkcs1', format: 'pem' })
  const privKey = privateKey.export({ type: 'pkcs1', format: 'pem' })

  res.cookie("userID", randomID);

  var InsertIntoDB = "INSERT INTO `userInfo` (`userID`, `userMail`, `userPW`, `pubKey`, `pvKey`) VALUES ('"+randomID+"', '"+email+"', '"+hashedPw+"', '"+pubKey+"', '"+privKey+"')";
  db.query(InsertIntoDB, function(err, result){
    if (err) throw err;
    res.redirect('/main/main');
  });

});

router.post('/sign',function(req,res,next){
  const UserCreds = req.body;
  var getPW = "SELECT IF((SELECT 1 FROM userInfo WHERE EXISTS(SELECT 1 FROM userInfo WHERE userMail='"+UserCreds.useremail+"') AND userMail='"+UserCreds.useremail+"')=1,'1','0') AS RES"

  db.query(getPW,function(err,result){
    if (err) throw err;
      if (result[0].RES == "1") {
        console.log("Correspondance mail !")

        var getPW = "SELECT userPW FROM userInfo where userMail ='"+UserCreds.useremail+"'";
        db.query(getPW,function(err,data){
          if (err) throw err;
          if (pwHash.verify(UserCreds.userpassword,data[0].userPW)) {
            console.log("Correspondance pw !")

            var randomID = crypto.randomBytes(10).toString("hex");
            var updateID = "UPDATE userInfo SET userID ='"+randomID+"' WHERE userMail='"+UserCreds.useremail+"'";

            res.cookie("userID", randomID);

            db.query(updateID,function(err,data){ //sécurité afin de changer l'ID a chaque connexion
              if (err) throw err;
            });

            res.redirect("/main/main")
          }else{
            res.redirect("/log")
            console.log("pas de correspondance pw")
          }
        })
      }else{
        res.redirect("/log")
        console.log("pas de correspondance mail")
      }});

});


module.exports = router;