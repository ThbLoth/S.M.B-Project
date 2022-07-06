var express = require('express');
var router = express.Router();
const multer = require('multer');
const detect = require('detect-file-type');
var exec = require('child_process').exec;
const crypto = require('crypto');
const fs = require('fs');
var db = require('../database');
var pwHash = require('password-hash')
const { DownloaderHelper } = require('node-downloader-helper');


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    }
    , filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

var upload = multer({ storage: storage });

function sendFile(path,IDfromCookie,ReceiverMail,docInt,password,docName){
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEIxOEY0QWRBZTE3ODk0Mzg4MWI5NTc0NDI2N2U1OWVDZWUyZjI1QWIiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NTY4ODI5NDExNjcsIm5hbWUiOiJTTUIifQ.INMx6MnIWuxLcY7QhSYdKa2Y0xTB4mG9-0013qr1-5w";
    var sendCmd = 'node put-files.mjs --token=' + token + ' ' + path;

    exec(sendCmd, function (err, stdout, stderr) {
        if (err) {
            console.error('Error occured: ' + err);
        } else {
            console.log('file uploaded :)');
            registerInDB(IDfromCookie,ReceiverMail,docInt,password,docName);
            fs.unlinkSync(path);
        }
    });

}

function registerInDB(IDfromCookie,ReceiverMail,type,password,docName){
    var getMailFromID = "SELECT userMail FROM userInfo where userID ='"+IDfromCookie+"'";
    db.query(getMailFromID, function (err, result) {
        if (err) throw err;
        var CID = fs.readFileSync('cid.txt', 'utf8');

        var Sendermail = result[0].userMail;

        var InserIntoDB="INSERT INTO `dataTransmitted` (`CID`, `fileName`, `userSender`, `userReceiver`, `type`, `pass`) VALUES ('"+CID+"', '"+docName+"', '"+Sendermail+"', '"+ReceiverMail+"', '"+type+"', '"+password+"');";

        db.query(InserIntoDB, function (err, result) {
            if (err) throw err;
            console.log("Data inserted into DB");
            fs.unlinkSync('cid.txt');
        });

        
    
    });
}

function encypherFile(CID,fileName,userSender,userReceiver,type,pass){
    console.log("Fichier téléchargé")
    console.log(userSender+" à envoyé un fichier à "+userReceiver+" nommé : "+fileName)
    var todecryptFile = "./downloaded/"+fileName;
    var finalDocpath ="./finalFiles/"+fileName.slice(10,fileName.length)

    var getPriKey = "SELECT pvKey FROM userInfo WHERE userMail = '"+userSender+"'";

    //img et pdf fini, txt a retravailler asap

    if (type==0){ //pdf
        
        var decryptPDF = "qpdf --decrypt --password="+pass+" "+todecryptFile+" "+finalDocpath;

        exec(decryptPDF, function (err, stdout, stderr) {
            if (err) {
                console.error('Error occured: ' + err);
            }else{
                console.log("Fichier décrypté")
                fs.unlinkSync(todecryptFile);
            }
        });

    }else if (type==1){ //img

        fs.writeFileSync("key.txt",pass);


        var DecryptIMG= "imcrypt -d "+ todecryptFile + " -k key.txt -i " + fileName.slice(10,fileName.length) ;
        exec(DecryptIMG, function (err, stdout, stderr) {
            if (err) {
                console.error('Error occured: ' + err);
            }else{
                console.log("Fichier décrypté")
                fs.unlinkSync(todecryptFile);
                fs.unlinkSync("key.txt");
                fs.copyFileSync(fileName.slice(10,fileName.length),finalDocpath);
                fs.unlinkSync(fileName.slice(10,fileName.length));
            }
        });

    }else if (type==2){ //txt
/*db.query(getPriKey, function (err, result) {
            if (err) throw err;
            const pvKey = result[0].pvKey;

            const dataToDecrypt = fs.readFileSync(todecryptFile,{encoding:'utf8'});

            const decrypted = crypto.privateDecrypt({
                key: pvKey,
                padding: crypto.constants.RSA_PKCS1_PADDING,
            },
            Buffer.from(dataToDecrypt, "base64"));
            console.log(decrypted.toString());
            //fs.writeFileSync(finalDocpath, decrypted.toString("utf8"), {encoding: "utf8"});
        });*/

    }

    var setFileDL = "UPDATE dataTransmitted SET readyToDL = 1 WHERE CID = '"+CID+"'";
    db.query(setFileDL, function (err, result) {
        if (err) throw err;
        console.log("File ready to DL");
    });

}

router.post('/getFile',upload.single('depot'),(req,res,next)=>{
    const file = req.file;
    if (!file){
        const error = new Error('No file found');
        error.httpStatusCode = 400;
        return next(error);
    }

    var userCred = req.body.mail

    var userIDfromCookie = req.cookies["userID"];

    var docPath = "uploads/"+file.filename
    var encDocPath = "./encrypted/encrypted_"+file.filename
    var KeyFile="./encrypted/encryptedKey_"+file.filename+".txt";

    var encDocName = "encrypted_"+file.filename

    var docType ="";

    detect.fromFile(docPath, function(err, result) {
 
        if (err) {
          return console.log(err);
        }
        
        if (result == null){
            docType = "txt"
        }else {
            docType = result.ext;
        }
    
        if(docType == "pdf"){

            //Génération mdp aléatoire
            const randomPW = crypto.randomBytes(10).toString("hex");
            console.log("randomPW: ", randomPW);
            var EncryptCMD = 'qpdf --encrypt '+randomPW+' '+randomPW+' 40 -- '+docPath+' '+encDocPath;

            exec(EncryptCMD, function (err){
                if (err){
                   console.error('Error occured: ' + err);
                }else{
                    fs.unlinkSync(docPath); //supprime le fichier de base pour ne garder que le pdf encrypté en local le temps d'envoyer
                    sendFile(encDocPath,userIDfromCookie,userCred,0,randomPW,encDocName);
                }
            })



        }else if(docType == "txt"){

            const datatoEncrypt = fs.readFileSync(docPath, {encoding: 'utf8'});

            var getPubKey = "SELECT pubKey FROM userInfo WHERE userMail = '"+userCred+"'";
            db.query(getPubKey, function (err, result) {
                var userPubKey = result[0].pubKey;

                const encrypted = crypto.publicEncrypt({
                    key: userPubKey,
                    padding: crypto.constants.RSA_PKCS1_PADDING,
                },
                Buffer.from(datatoEncrypt));
                
                fs.writeFileSync(encDocPath, encrypted.toString("base64"), {encoding: "utf8"});
                fs.unlinkSync(docPath);
                sendFile(encDocPath,userIDfromCookie,userCred,2,"",encDocName);
            });

        }else if (docType=="png" || docType=="jpg" || docType=="img"){
            var EncryptIMG="imcrypt -e "+ docPath + " -i "+ encDocPath + " -p " + KeyFile;

            exec(EncryptIMG,function(err){
                if(err){
                    console.error('Error occured :'+ err);
                }
                else{
                    fs.unlinkSync(docPath);
                    var encPicPath = "./encrypted_"+file.filename
                    var keyDocPath = "./encryptedKey_"+file.filename+".txt"
                    var picname = "encrypted_"+file.filename

                    var key = fs.readFileSync(keyDocPath, "utf8");

                    fs.unlinkSync(keyDocPath);


                    sendFile(encPicPath,userIDfromCookie,userCred,1,key,picname);
                }
            })
        }

    });

    res.redirect('/main/main')
});


router.post('/dlFile',(req,res,next)=>{
    var userCred = req.body.password
    var userIDfromCookie = req.cookies["userID"];

    var getPWfromID = "SELECT userPW FROM userInfo WHERE userID ='"+userIDfromCookie+"'";
    db.query(getPWfromID, function (err, result) {
        if (err) throw err;
        var userPW = result[0].userPW;

        if(pwHash.verify(userCred,userPW)){
            console.log("password correct");

            var getMailFromID = "SELECT userMail FROM userInfo WHERE userID ='"+userIDfromCookie+"'";
            db.query(getMailFromID, function (err, mailRes) {
                if (err) throw err;

                var userMail = mailRes[0].userMail;
                var getDataFromDB = "SELECT * FROM dataTransmitted WHERE userReceiver ='"+userMail+"' AND readyToDL = 0";

                db.query(getDataFromDB, function (err, data) {
                    if (err) throw err;
                    
                    var dataLength = Object.keys(data).length;

                    if (dataLength == 0) {
                        console.log("Aucun fichier à télécharger")
                    }else{
                        for (var i=0;i<dataLength;i++){
                            var CID = data[i].CID;
                            var fileName = data[i].fileName;
                            var userSender = data[i].userSender;
                            var userReceiver = data[i].userReceiver;
                            var type = data[i].type;
                            var pass = data[i].pass;
    
                            var link = "https://"+CID+".ipfs.dweb.link/"+fileName;
                            var DL = new DownloaderHelper(link, "./downloaded");
                            DL.on('end', () => 
                                encypherFile(CID,fileName,userSender,userReceiver,type,pass)
                            );
                            DL.start();
                        }
                    
                    }

                });

            });

        }else{
            console.log("password incorrect");
        }

    });
    res.redirect('/main/main')
});

/* GET users listing. */
router.get('/main', function(req, res, next) {
    res.render('mainpage', { title: 'Express' });
});


router.get('/test', function(req, res, next) {
    var userIDfromCookie = req.cookies["userID"];
    const getMail = "SELECT userMail FROM userInfo where userID = '"+userIDfromCookie+"'";
    db.query(getMail, function (err, result) {
        var userMail = result[0].userMail;

        const getFileNames= "SELECT fileName FROM dataTransmitted WHERE userReceiver='"+userMail+"' AND readyToDL = 1"
        db.query(getFileNames, function (err, result) {
            if (err) throw err;
            var fileNames = result;
            const size = Object.keys(fileNames).length;

            if (size == 0) {
                console.log("Aucun fichier à télécharger")
                res.redirect('/main/main')
            }else{
                var fN = fileNames[0].fileName;
                var path = "./finalFiles/"+fN.slice(10,fN.length);
                res.download(path);

                var delFromDB = "DELETE FROM `dataTransmitted` WHERE `fileName` = '"+fN+"'";
                db.query(delFromDB, function (err, result) {
                    if (err) throw err;
                    console.log("Data deleted from DB");
                });
            }
        });

    });
})



module.exports = router;
