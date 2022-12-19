const express = require('express');
const mysql = require('mysql');
const app = express();
const session = require('express-session');
const bcrypt = require('bcrypt');

app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Dimass123',
    database: 'blog'
  });


app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  console.log(req.session.userId)
  if (req.session.userId === undefined) {
    console.log('Anda tidak login');
    res.locals.username = 'Tamu';
    res.locals.isLoggedIn = false;
  } else {
    console.log('Anda telah login');
    res.locals.username = req.session.username;
    res.locals.isLoggedIn = true;
  }
  next();
});

connection.connect(function(error) {
  if (error) throw error;
  console.log("Connected!");
});



app.get('/', ( req, res)=>{
    res.render('home.ejs')
});

app.get('/top', (req, res)=>{
  connection.query(
    'SELECT * FROM articles', (error, results)=>{
      res.render('top.ejs', {articles:results});
    }
  )
})


app.get('/register', (req, res)=>{
  res.render("register.ejs",{errors:[]})
})


app.get('/login', (req, res)=>{
  res.render('login.ejs',{status:false})
});

// app.post('/register', (req, res)=>{
//   const username=req.body.username;
//   const email=req.body.email;
//   const password=req.body.password;
//   connection.query(
//     'INSERT INTO users(username, email, password) VALUES (?,?,?)',[username, email, password], (error, results)=>{
//       console.log(results)
//       req.session.userId=results.insertId;
//       req.session.username=username;
//       res.redirect('/top')
//     }
//   )
// })

app.post('/register', (req, res, next)=>{
  console.log('Pemeriksaan nilai input kosong')
  const username=req.body.username;
  const email=req.body.email;
  const password=req.body.password
  const errors=[]

    if(username === ''){
      errors.push('username kosong')
    }
    if(email === ''){
      errors.push('email kosong')
    }
    if(password === ''){
      errors.push('password kosong')
    }
    if(errors.length > 0){
      res.render('register.ejs',{errors:errors})
    }else{
      next()
    }
},
    (req, res, next)=>{
      console.log("Check username")
      const username=req.body.username;
      const errors=[];
      connection.query(
        'SELECT * FROM users where username = ?', [username], (error, results)=>{
          if(results.length > 0){
            errors.push("username duplikat")
            console.log(errors)
            res.render('register.ejs', {errors:errors})
          }else{
            next();
          }
        }
      )
},

    (req, res, next)=>{
      console.log("Check email")
      const email=req.body.email;
      const errors=[];
      connection.query(
        'SELECT * FROM users where email=?', [email], (error, results)=>{
          if(results.length > 0){
            errors.push("email duplikat")
            console.log(errors)
            res.render('register.ejs', {errors:errors})
          }else{
            next()
          }
        }
    )
},

    (req, res)=>{
      const username=req.body.username;
      const email=req.body.email;
      const password=req.body.password

      bcrypt.hash(password, 10, (error, hash)=>{
      console.log(hash)
      connection.query(
        'INSERT INTO users (username, email, password) VALUES ( ?, ?, ?)',
        [username, email, hash], (error, results)=>{
          console.log(results)
          console.log(error)
          req.session.username= username;
          req.session.userId=results.insertId
          res.redirect('/top');
        }
      )
    
    });
    }

);

app.get('/articles/:id', (req, res)=>{
  const id=req.params.id
  connection.query(
    'SELECT * FROM articles where id= ?', [id], (error, results)=>{
      console.log(results)
      res.render('articles.ejs',{articles: results[0]})
    }
    
  )
})

app.post('/login',(req, res)=>{
  const username= req.body.username;
  const password=req.body.password;
  console.log(username)
    connection.query(
        'SELECT * FROM users WHERE username=?', [username],(error, results)=>{
            if(results.length > 0){
                const plain=req.body.password
                const hash=results[0].password

                bcrypt.compare(plain, hash, (error, isEqual)=>{
                  if(isEqual){
                    req.session.userId = results[0].id;
                    req.session.username = results[0].username;
                    res.redirect('/top');
                  }else{
                    res.render('login.ejs',{status:true});
                  }
                })
                
              }else{
                res.render('login.ejs',{status:true});
              }
        }
    )
})

app.get('/logout', (req, res) => {
  req.session.destroy((error) => {
    res.redirect('/top');
  });
});

app.listen(3000);