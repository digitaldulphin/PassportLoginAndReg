console.log(" Start server.js for passport app ");
/**	index.j
	Created by Norman Potts.	
*/

const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const express = require('express'); 
const https = require('https');
const http = require('http').Server.app; 
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');  
const hostname = 'localhost';//'localhost';//'127.0.0.1';
const port = 3000;
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require('bcryptjs');
const expressValidator = require('express-validator');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const nodemailer = require("nodemailer");
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;
const LinkedInStrategy = require('passport-linkedin').Strategy;
const WindowsLiveStrategy = require('passport-windowslive').Strategy;
const homeURL = 'http://'+hostname+':'+port;
/// Constant transporter object for the nodemailer thing.
const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: "myemailappjk@gmail.com", pass: "k0k0k0k0TUT" }});
const ssl_options = {
  key: fs.readFileSync('C:/NODEJS_APPS/PassportLoginAndReg/key.pem'),
  cert: fs.readFileSync('C:/NODEJS_APPS/PassportLoginAndReg/cert.pem')
};


/* 
 *
 *
 *
 ** PUBLIC UTILITY FUNCTIONS START **/
/// Generate a token when necessary
function generateToken() {
	var token = '';   var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (var i = 32; i > 0; --i) 
	{  token += chars[Math.round(Math.random() * (chars.length - 1))];  }           
	return token;
}
/// validates passwords
function validatepassword(pass) {
  var flag = ( pass.length > 0 && pass.length < 21 )? true : false ;     
  return flag;
}
//// validates emails.
function validateEmail( givenEmail ){
  var flag = false; var firstpass = /^[A-Z0-9@._%+-]{6,254}$/i; // No invalid characters. Not to big or to short.
	var pattnemail = /^[A-Z0-9][A-Z0-9._%+-]{0,63}@(?:[A-Z0-9-]{1,63}\.){1,125}[A-Z]{2,63}$/i;  
  if ( firstpass.test(givenEmail) == true ) {    
     flag = ( pattnemail.test(givenEmail) )? true : false;    
  } else {
    flag = false;    
  }  	
	return flag;
}
//// function that removes old tokens from waitingAccounts. Old as in older than their 'expire' date.
function removeOldtokens() { console.log('removeOldtokens');
  var SELECTSTATEMENT = "SELECT * FROM waitingAccounts;";	
	db = new sqlite3.Database(waitingAccounts);   		
	db.all(SELECTSTATEMENT,[],(err, rows ) => {	if (err) { console.log("error at get /db.all Select  "); throw err; }	
    db.close();
    var now = new Date();  var toremove = [];
    if ( rows.length > 0) {
      for(var i =0; i < rows.length; i++) {          
        var ex = rows[i]['expires'];
        var expires = new Date(ex);
        if ( now > expires ) {
          var id = rows[i]['id'];
          toremove.push(id);
        }        
      }
      if( toremove.length > 0) {
        var odis = toremove.join(" , ");
        db = new sqlite3.Database(waitingAccounts);   					
        db.serialize(function() {        
          var deleteStatement = "DELETE FROM waitingAccounts WHERE id IN ( "+odis+" );";			
          //console.log(deleteStatement);
          db.run(deleteStatement);								
          db.close();          
        });
      }
    }
  });
}//// End of Function removeOldtokens.
/** PUBLIC UTILITY FUNCTIONS END 
 *
 *
 *  
 */




/** On start up, set up waitingAccounts database. 
 *  The waitingAccounts database is for accounts that have just been submitted threw the sign up, and are waiting to be activated. 
 *  Once activated accounts are deleted.
 *  Currently deleted on start up.
 */
var waitingAccounts = 'private/waitingAccounts.db';
fs.access(waitingAccounts, fs.constants.R_OK | fs.constants.W_OK, (err) => { 
	if(!err)  { console.log(' Database waitingAccounts exists going to delete now. ');
		fs.unlink(waitingAccounts, (err) => { if (err) { console.log("Failed to delete database:"+err); }}); ////Do db delete waitingAccounts.
	} else { console.log(' Database waitingAccounts does not exist...'); }
	var db = new sqlite3.Database(waitingAccounts);
	db.serialize(function() {
		/** Begin running sql statements to create DB... */
		var DROPtableStatement= "DROP TABLE IF EXISTS waitingAccounts;";
		db.run(DROPtableStatement);
		var CREATEtableStatement = "CREATE TABLE waitingAccounts (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, passer TEXT, salt TEXT, token TEXT, expires TEXT )";
		db.run(CREATEtableStatement);
		db.close();
		console.log("  Database created.  ");
}); });//// End of waitingAccounts database creation.

/** Set up logins database. 
 *  The logins is for accounts that have been activated and can be logged in to.
 *  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, passer TEXT, salt TEXT 
 *  Currently deleted on start up.
 */
var logins = 'private/logins.db';
fs.access(logins, fs.constants.R_OK | fs.constants.W_OK, (err) => { 
	if(!err)  { console.log(' Database logins exists going to delete now. ');
		fs.unlink(logins, (err) => { if (err) { console.log("Failed to delete database:"+err); }}); ////Do db delete logins.
	} else { console.log(' Database logins does not exist...'); }
	var db = new sqlite3.Database(logins);
	db.serialize(function() {
		/** Begin running sql statements to create DB... */
		var DROPtableStatement= "DROP TABLE IF EXISTS logins;";
		db.run(DROPtableStatement);
		var CREATEtableStatement = "CREATE TABLE logins (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, passer TEXT, salt TEXT )";
		db.run(CREATEtableStatement);				
    var instertStatement = "INSERT INTO logins ( email, passer, salt ) VALUES ('storminnormanpotts@hotmail.com', '$2a$10$4b/QxpgpPV7N7Ji3KS857.vpItzXROCFlCojj9X0JQiE0x4WAkhLa', '$2a$10$4b/QxpgpPV7N7Ji3KS857.' );"    
    db.run(instertStatement);	
		db.close();
		console.log("  Database created.");
}); });//// End of logins database creation.

/** Set up UserCollection database. 
 *  The UserCollection is for user records. The user records are assocated
 *  with the social accounts of a user and local login accounts of a 
 *  particular user.
 *  Currently deleted on start up.
 */
var UserCollection = 'private/UserCollection.db';
fs.access(UserCollection, fs.constants.R_OK | fs.constants.W_OK, (err) => { 
	if(!err)  { console.log(' Database UserCollection exists going to delete now. ');
		fs.unlink(UserCollection, (err) => { if (err) { console.log("Failed to delete database:"+err); }}); ////Do db delete UserCollection.
	} else { console.log(' Database UserCollection does not exist...'); }
	var db = new sqlite3.Database(UserCollection);
	db.serialize(function() {
		/** Begin running sql statements to create DB... */
		var DROPtableStatement= "DROP TABLE IF EXISTS UserCollection;";
		db.run(DROPtableStatement);                                  ////id, token, name, email 
		var CREATEtableStatement = "CREATE TABLE UserCollection ( i INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT, token TEXT, name TEXT, email TEXT  )";
		db.run(CREATEtableStatement);				
		db.close();
		console.log("  Database created. ");
}); });//// End of UserCollection database creation.






/** Express App Setup and MiddleWare stuff. */
const app = express();
////Set Static Path to Public folder.
app.use(express.static(path.join(__dirname,'public')));
app.set('view engine','ejs');
//// Connect Flash.
app.use(flash());
//// Middleware for Express Session.
app.use(session({  secret: 'secret',  saveUninitialized: true,  resave: true	}));
app.use(passport.initialize());
app.use(passport.session());
//// Express Validator Middleware.
app.use(expressValidator());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());
//// Specify middleware...  The function is executed every time the app receives a request. Mounts the specified middleware function or functions at the specified path: the middleware function is executed when the base of the requested path matches path.
app.use(function(req, res, next) {
	res.locals.success_msg = req.flash('success_msg'); //// global variable for success messages.
	res.locals.error_msg = req.flash('error_msg');     //// for any error messages
	res.locals.error = req.flash('error');             //// passport sets its own flash messages as error.
	res.locals.Given_Email = req.flash('Given_Email'); //// returning username to input...
	res.locals.user = req.user || null;
	next(); //// Routing documentation for express... "call next() within the body of the function to hand off control to the next callback."
});



/* 
 *
 *
 *
 ** Begining of App Routes **/
app.listen(port);

/** When '/' gets requested. */
app.get('/', function(req, res) { console.log(" get '/' ");	
	var viewPath = path.join(__dirname, 'public', 'LandingPage.ejs');				
	var TPL = { route: homeURL };	
	res.render(viewPath, TPL );						
});////End of When root is requested.

/** When '/SignUp' gets requested. */
app.get('/SignUp', function(req, res) { console.log(" get '/SignUp' ");
	var viewPath = path.join(__dirname, 'public', 'SignUp.ejs');				
	var TPL = { route: homeURL };	
	res.render(viewPath, TPL );					
});////End of When SignUp is requested.

/** When '/Login' gets requested. */
app.get('/Login', function(req, res) { console.log(" get '/Login' ");	
	var viewPath = path.join(__dirname, 'public', 'Login.ejs');				
	var TPL = { route: homeURL };	
	res.render(viewPath, TPL );						
});////End of When Login is requested.




//// Route for form post of email, password registration.
//// Sends and email for activation to given email.
//// Places account into waitingAccounts until it is activated.
app.post('/doSignUpplz/', function (req, res) {  console.log(" post '/doSignUpplz/'  ");		
	var input = req.header('jsonInput');
	var Given_Email; var Given_password;
	Given_Email = req.body.Email; Given_Password = req.body.password;
	/// Check email for being valid email
	if (validateEmail(Given_Email)) {
    //// Email is valid, for now flash back green success. 
    if(validatepassword(Given_Password)){     console.log("password: "+ Given_Password);       
      var token = generateToken();
      /// create expiration date
      var exs = new Date();
      exs.setHours(exs.getHours() + 1);
      var expires = exs.toISOString();      
      function DoInserton( email, pa, secondLoop, saltyBit, db, token, expires ) {
        if( secondLoop == false){ 
          bcrypt.genSalt(10, function(err, salt) {  bcrypt.hash(pa, salt, function(err, hash) {
              DoInserton( email, hash, true, salt, db, token, expires );
          }); });
        } else {								
          var INSERTstatement = "INSERT INTO waitingAccounts ( id, email, passer, salt, token, expires ) values ( null, \""+email+"\",  \""+pa+"\", \""+saltyBit+"\",  \""+token+"\", \""+expires+"\" )";							
          console.log(INSERTstatement);
          db.run( INSERTstatement );	
          db.close();					
      }}//// End of Function DoInsertonEditorDB.        
      var db = new sqlite3.Database( waitingAccounts );             
      DoInserton( Given_Email, Given_Password, false, null, db, token, expires );
      var kinl = hostname+":"+port+"/activation/"+token+"";
      let mailOptions = {
        from: 'myemailappjk@gmail.com', 
        to: Given_Email,
        subject: "Web App Account Activation", 
        text: "Account activation for this web app.", 
        html: "<h3>Account Activation for this web app.</h3><a href = \""+kinl+"\" <h4>Click on this link to activate your account </h4></a> <h5> or copy and paste this link in your browser: "+kinl+" </5><p>This will expire in 6 hour.</p>" // html body
      };                
      transporter.sendMail(mailOptions, function(error, info){
        if (error) 
        {  console.log(error); }
      }
    }  
    else 
		{  console.log('Email sent: ' + info.response);  console.log("Message id: %s", info.messageId);  }
        /// Send waiting for sign up.
        var viewPath = path.join(__dirname, 'public', 'waitingforActivation.ejs');				
        var TPL = { route: homeURL };	
        res.render(viewPath, TPL );			                      
      });    
      removeOldtokens();    
    }else{
      /// password is invalid Flash invalid password.
      req.flash('error_msg', 'Password is invalid'); 
      res.redirect('/SignUp');
    }
  } else {
    /// Email is invalid Flash invalid email.
    req.flash('error_msg', 'Email is invalid'); 
    res.redirect('/SignUp');
  }	
}); //// End of post 'doSignUpplz'




//// Route for activation from email registration.
//// Checks token for the account in the database and activates it on matching token.
//// activates an account by placing account into logins.
app.get(/\/activation\/*/, function(req, res) { console.log(" get '/activation' ");
  var lru = req.url;
  var givenToken = lru.replace(/\/activation\//, '');
  var tokentest = /^[A-Z0-9]{32}$/i;
  if( tokentest.test(givenToken) == true ){
    /// id, email, passer, salt, token, expires
    var SELECTSTATEMENT = "SELECT * FROM waitingAccounts WHERE token = '"+givenToken+"';";	
    console.log(SELECTSTATEMENT);
	var	db = new sqlite3.Database(waitingAccounts);   		
	db.all(SELECTSTATEMENT,[],(err, rows ) => {	if (err) { console.log("error at get /db.all Select  "); throw err; }				      
      console.log(rows);
      db.close();      
      if(rows.length == 1 ) {
      var id = rows[0]['id'];
      var passer = rows[0]['passer'];
      var email = rows[0]['email'];
      var salt = rows[0]['salt'];      
      var now = new Date();
      var ex = rows[0]['expires'];
      var expires = new Date(ex);
      if ( now > expires ) {
        //remove old token.
        var viewPath = path.join(__dirname, 'public', 'unsuccesfulActivation.ejs');				
        var TPL = { route: homeURL };	
        res.render(viewPath, TPL );					
        removeOldtokens();        
      }else{        
        //Begin activation.                
        /// id , email TEXT, passer TEXT, salt TEXT 
        var ficalbd = new sqlite3.Database(logins);   					
        ficalbd.serialize(function() {
          var instertStatement = "INSERT INTO logins ( email, passer, salt ) VALUES ('"+email+"', '"+passer+"', '"+salt+"' );";						          
          console.log(instertStatement);
          ficalbd.run(instertStatement);	
          ficalbd.close();
          /// Now remove the waiting accounts.
          var wA = new sqlite3.Database(waitingAccounts);   					
          wA.serialize(function() {        
            var deleteStatement = "DELETE FROM waitingAccounts WHERE id = "+id+";";			
            console.log(deleteStatement);             
            wA.run(deleteStatement);								
            wA.close();                                     
            /// Now send back response.              
            var viewPath = path.join(__dirname, 'public', 'successfulActivation.ejs');				
            var TPL = { route: homeURL };	
            res.render(viewPath, TPL );			              
            removeOldtokens();
          });                  
        });					         
      }
      } else{
        var viewPath = path.join(__dirname, 'public', 'unsuccesfulActivation.ejs');				
        var TPL = { route: homeURL };	
        res.render(viewPath, TPL );			              
        removeOldtokens();
      }
	});			 
  } else{
      var viewPath = path.join(__dirname, 'public', 'unsuccesfulActivation.ejs');				
      var TPL = { route: homeURL };	
      res.render(viewPath, TPL );			              
      removeOldtokens();
  }
});////End of When activation is requested





/// Routes for the social login buttons. scope, email, img, name,  <--- cannot do because not i have to submit for app review. 
app.get('/doFBLogin', passport.authenticate('facebook' ));
app.get('/doMSLogin', passport.authenticate('windowslive', { scope: ['wl.signin', 'wl.basic'] }));
app.get('/doLinkedinLogin', passport.authenticate('linkedin'));
app.get('/doGoogleLogin', passport.authenticate('google',  { scope: ['email', 'profile'] } ));

/// Return routes for the social login returns.
app.get('/FBreturn', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) { res.redirect('/Loggedin');  });
app.get('/linkedinReturn', passport.authenticate('linkedin', { failureRedirect: '/login' }), function(req, res) { res.redirect('/Loggedin');  });
app.get('/Googlereturn', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) { res.redirect('/Loggedin');  });
app.get('/MSReturn', passport.authenticate('windowslive', { failureRedirect: '/login' }), function(req, res) {  res.redirect('/Loggedin');  });




//// Login for login form.
app.post('/doLoginPlz/', function(req, res, next) { console.log(" post /doLoginPlz/")
	passport.authenticate('local', function(err, user, info) {
		if (err) { return next(err); }
		if (!user) {
			var x = req.body.username;	
			req.flash('Given_Email',x);
			req.flash('error', info.message);
			return res.redirect('/Login');      
		} 
		req.logIn(user, function(err) {
			if (err) { return next(err); }
			return res.redirect('/Loggedin');
		});
	})(req, res, next);
});//// End of route doLoginPlz.
 
//// The route for logout, and preform the logout. Redirects user to login page.
app.get('/logout', function (req, res) { console.log(' get /logout');	
	req.logout(); req.flash('success_msg', 'You are logged out'); res.redirect('/Login');
});
  
////  Everything after Loggedin must be authenticated.
app.all(/\/Loggedin\/*/, ensureAuthenticated);  

//// Get Editor, send menu for now.
app.get('/Loggedin', ensureAuthenticated, function(req, res) { console.log(" get /Loggedin ");		
  var User = req.user;
  var userstr = JSON.stringify(User);  
	var Email = req.user.email;	
	var viewPath = path.join(__dirname, 'private', 'menu.ejs');		
	var TPL = { route: homeURL, Email: Email, User: userstr };	
	res.render(viewPath, TPL );			
});
 
 


 
 
 
 

/* 
 *
 *
 *
 ** PASSPORT CONFIGUATION START **/
 

/** Define passport use for LocalStrategy */
passport.use(new LocalStrategy(function(Given_Email, Given_Password, done) {		
var editor_DB = new sqlite3.Database(logins); //// id INTEGER , email TEXT, passer TEXT, salt TEXT 	
	editor_DB.get('SELECT salt, passer, email, id FROM logins WHERE email = ?', Given_Email, function(err, row) {
		if (!row) { return done(null, false, {message:"Unknown User"}); }					 
		var storedPassword = row.passer; var candidatePassword = Given_Password;		 
		bcrypt.compare(candidatePassword, storedPassword, function(err, isMatch) {
			if(err) 
      { console.log("error at passport use bycrypt. compare "); throw err; }
			if (!isMatch) 
			{  return done(null, false, { message:"Invalid Password" }); } 
			else 
			{ return done(null, row); }		 		
		});
	});
})); //// End of passport.use


/*
	" The user's faccebook profile is returned to represent the  logged-in user. The application will associate the facebook  account with a user record in UserCollection database, and return   that user instead."
    '/FBreturn', '/linkedinReturn','/Googlereturn', '/MSReturn', 
*/
/** Define papssport use for  Facebook */
passport.use( new FacebookStrategy({ clientID: '1173185039504693', clientSecret: 'd4cdf18abe9782824c192d5ccd747604', callbackURL: '/FBreturn' },
  function(req, token, refreshToken, profile, done) { return  myStrategyLogic(req, token, refreshToken, profile, done); }
));
/** Define papssport use for  Linkedin */
passport.use( new LinkedInStrategy({ consumerKey: '78kfja19qe0h9u', consumerSecret: 'X1J9AbnmmTyNl021', callbackURL: '/linkedinReturn' },
  function(req, token, refreshToken, profile, done) { return  myStrategyLogic(req, token, refreshToken, profile, done); }
));
/** Define papssport use for  Google */
passport.use( new GoogleStrategy({ clientID: '694327794811-artpgs1181kr2lqbn20agd9uk42ffkep.apps.googleusercontent.com', clientSecret: '5dNfv9s3ZaoQ9mUDTsHi9Ipk', callbackURL: '/Googlereturn' },
  function(req,  token, refreshToken, profile, done ) { return  myStrategyLogic(req, token, refreshToken, profile, done);  }
));
/** Define papssport use for  Microsoft */
passport.use( new WindowsLiveStrategy({ clientID: '1c8c0463-2fa3-450b-ac9a-f1a734b73b03', clientSecret: 'eYOKA82=tqjebeJHJ964-^(', callbackURL: '/MSReturn' },
  function(req,   token, refreshToken, profile,  done) { return  myStrategyLogic(req, token, refreshToken, profile, done); }
));


/** myStrategyLogic
      This function will handle the logic during login strategies for all accounts.
*/
function myStrategyLogic( req, token, refreshToken, profile, done ) {   
  process.nextTick(function() {
  console.log("function myStrategyLogic {");
  ///console.log('profile: '+JSON.stringify( profile ));            
  var email = 'not used yet'; var sql = "";
  var givenID = profile.id;
  if (!req.user) { /* Check if the user is already logged in*/          
    var db = new sqlite3.Database(UserCollection);    
    sql = "SELECT id FROM UserCollection WHERE id = '"+givenID+"';";
    console.log(sql);
    db.get( sql, (err, row) => {    
      if (err) { console.log('err: '+err);  return done(err); }
      if ( row ) {
        /// if there is a user id already but no token (user was linked at one point and then removed)
        if ( !row.token ) {
          var name  = profile.displayName;
          //var email = profile.emails[0].value;
          var user = { id:row.id, token:row.token, name:row.name, email:row.email }; 
          /// Write token name and email to  user record.          
          sql = "UPDATE UserCollection SET token = '"+token+"', email = '"+email+"', name = '"+name+"' WHERE id = '"+givenID+"';";
          console.log(sql);
          db.run(sql, (err) => { 
            if (err) { return done(err); }            
            return done(null, user);          
          });    
        }
        return done(null, user); // user found, return that user
      } else {
        // if there is no user, create them                        
        var name  = profile.displayName;        
        //var email = profile.emails[0].value;
        var newUser = { id:givenID, token:token, name:name, email:email}; 
        sql = "INSERT INTO UserCollection ( id, token, name, email  ) VALUES ( '"+givenID+"', '"+token+"','"+name+"', '"+email+"' );";        
        console.log(sql);
        db.run(sql, (err) => { 
          if (err) { return done(err); }
          return done(null, newUser );          
        });           
      }
    });/// End db get id
  } else {
    // user already exists and is logged in, we have to link accounts
    var user  = req.user; // pull the user out of the session    
    var name  = profile.displayName;
    //var email = profile.emails[0].value;
    /// Write token name and email to  user record.          
    sql = "UPDATE UserCollection SET token = '"+token+"', email = '"+email+"' name = '"+name+"' WHERE id = '"+givenID+"';";
    console.log(sql);
    db.run(sql, (err, row) => { 
      if (err) { return done(err); }
      user = { id:row['id'], token:row['token'], name:row['name'], email:row['email'] }; 
      return done(null, user);          
    });  
  }  
  console.log("}/// End of function myStrategyLogic ");
  
  });
}//// End of myStrategyLogic























/**
 Configure Passport authenticated session persistence.

 In order to restore authentication state across HTTP requests, Passport needs
 to serialize users into and deserialize users out of the session.  In a
 production-quality application, this would typically be as simple as
 supplying the user ID when serializing, and querying the user record by ID
 from the database when deserializing.  
 
 Need to do that ^^^
*/ /// console.log('serializeUser account: '+account);
/*
passport.serializeUser(function(account, done) { 		
	return done(null, account.id); 	
}); //// Method serializeUser is condensed.
passport.deserializeUser(function(id, done) {	
	var editor_DB = new sqlite3.Database(logins);
	editor_DB.get('SELECT id, Email  FROM logins WHERE id = ?', id, function(err, row) {
		if (!row){ 
			return done(null, false); 
		}
		return done(null, row);
	});
});//// End of passport.deserializeUser
*/
/**

Problem right now is I have to have check the userCollection for the ID of a user.
This mean I have to add the user into the user collection during the strategies. 
Should complete logic routes in scotch io example.

passport.serializeUser(function(user, done) { 		
console.log('serialize');
console.log(user);
	return done(null, user); 	
}); //// Method serializeUser is condensed.
passport.deserializeUser(function(obj, done) {		
console.log('DEserialize');
console.log(obj);

		return done(null, obj);
	
});//// End of passport.deserializeUser
*/

passport.serializeUser(function(user, done) {  
//console.log('serialize');
//console.log('user: '+JSON.stringify( user ));
  done(null, user.id);
});
passport.deserializeUser(function(obj, done) {
//console.log('DEserialize');
//console.log('obj: '+obj);  
  /*" Querying the user record by ID from the database when deserializing.  "*/
  var db = new sqlite3.Database(UserCollection);
  var SELECTSTATEMENT = "SELECT id, name  FROM UserCollection WHERE id = '"+obj+"';"; 
  console.log("Deserialize select: "+SELECTSTATEMENT);
	db.get(SELECTSTATEMENT, (err, row) => {    
    console.log('deserializeUser row: '+JSON.stringify(row));
    //console.log('err: '+err);
    if (!row){ 
			return done(null, false); 
		}else{   
      var user = { id : row.id, lit: "lit" };
      return done(null, user);
    }
  });
});



//// Confirm the a request is authenticated.
function ensureAuthenticated(req, res, next){   console.log('ensureAuthenticated');
	if(req.isAuthenticated()) { return next(); } 
	else { req.flash('error_msg','You are not logged in'); res.redirect('/Login'); }
}//// End of function ensureAuthenticated.
/* The route to login and try to authenticate. */


/** PASSPORT CONFIGUATION  END 
 *
 *
 *  
 */
