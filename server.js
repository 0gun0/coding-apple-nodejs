const express = require('express'); //express라이브러리 인용문
const { MongoClient, ObjectId } = require('mongodb');
const app = express()
const bcrypt = require('bcrypt')

app.use(express.static(__dirname + '/public'))
app.set('vew engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))

//passport 라이브러리 세팅
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')

app.use(passport.initialize())
app.use(session({
  secret: '암호화에 쓸 비번',
  resave : false,
  saveUninitialized : false,
  cookie : {maxAge : 60 * 60 * 1000 } //쿠키 한시간 
}))
app.use(passport.session()) 

app.get('/',(요청, 응답) =>{
    응답.sendFile(__dirname + '/index.html')
})

app.get('/news',(요청, 응답) =>{
    db.collection('post' ).insertOne({title : '어쩌구'})
    // 응답.send('오늘 비옴')
})

app.get('/list', async (요청, 응답) => {
  try {
    // 'created_at' 필드를 기준으로 내림차순으로 정렬하여 게시글 가져오기
    let result = await db.collection('post').find().sort({ created_at: -1 }).toArray();
    console.log(result)
    응답.render('list.ejs', { 글목록: result });
  } catch (error) {
    console.error(error);
    응답.status(500).send('게시글 목록을 불러올 수 없습니다.');
  }
});


app.get('/write', (요청, 응답) =>{
    응답.render('write.ejs')
})

// app.post('/add', async (요청, 응답)=>{
//     console.log(요청.body)

//     // if (제목이 빈칸이면){
//     //     db저장하지 말고 경고문 보내주고
//     // } else {
//     //     await db.collection('post').insertOne({title : 요청.body.title, content :
//     //         요청.body.content})
//     // }
    

//     try {
//     if (요청.body.title == ''){
//         응답.send('제목 입력해라')
//     } else {
//       await db.collection('post').insertOne({title : 요청.body.title, content :
//     요청.body.content})
//     응답.redirect('/list')
//     }
//     }   catch(e) {
//         console.log(e) //에러메서지 출력해줌
//         응답.status(500).send('서버에러남')
//     }
    
// })

app.post('/add', async (요청, 응답) => {
  try {
    const { title, content } = 요청.body;

    if (!title.trim()) {
      return 응답.send('제목을 입력해주세요.');
    }

    // 게시글 추가 db에 들어가게끔 하는 데이터 정의
    await db.collection('post').insertOne
    ({ title, content, created_at : new Date(), });

    // 게시글 추가 후 최신 글로 정렬
    const sortedResult = await db.collection('post').find().sort({ created_at: -1 }).toArray();

    응답.redirect('/list');
  } catch (error) {
    console.error(error);
    응답.status(500).send('서버 오류가 발생했습니다.');
  }
});

app.get('/detail/:id', async (요청, 응답) => {
    try {
      let result = await db.collection('post').findOne({ _id : new ObjectId(요청.params.id) })
      if (result == null) {
        응답.status(400).send('그런 글 없음')
      } else {
        응답.render('detail.ejs', { result : result })
      }
      
    } catch (e){
      응답.send('이상한거 넣지마라')
    }
    
  })

app.get('/edit/:id', async (요청, 응답)=>{

    // db.collection('post').updateOne({어떤document},{어떤내용으로 수정할지})

    let result = await db.collection('post').findOne({_id : new 
    ObjectId(요청.params.id)})
    console.log(result)
    응답.render('edit.ejs', {result : result})
})

app.post('/edit', async (요청, 응답)=>{

  let result = await db.collection('post').updateOne({_id : new ObjectId
    (요청.body.id) },
    {$set : {title: 요청.body.title, content: 요청.body.content}})
  console.log(요청.body)
  응답.redirect('/list')
  console.log(result)
  })


app.delete('/delete', async (요청, 응답) =>{
  console.log(요청.query)
  //db에 있던 document 삭제하기
  await db.collection('post').deleteOne({_id : new ObjectId
    (요청.query.docid)})
    응답.send('삭제완료')
})

//passport 라이브러리 api :제출한 아이디/비번을 db와 비교하는 코드
passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
  let result = await db.collection('user').findOne({ username : 입력한아이디})
  if (!result) {
    return cb(null, false, { message: '아이디 DB에 없음' })
  }
  if (await bcrypt.compare(입력한비번, result.password)){
    return cb(null, result)
  } else {
    return cb(null, false, { message: '비번불일치' });
  }
}))
//해싱된 비밀번호와 일치불일치 비교



app.get('/login', async (요청,응답)=>{
  console.log(요청.user)
  응답.render('login.ejs')
})

app.post('/login', async (요청,응답,next)=>{
  
  passport.authenticate('local',(error, user, info)=>{
    if (error) return 응답.status(500).json(error)
    if (!user) return 응답.status(401).json(info.message)
    요청.logIn(user, (err)=>{
      if (err) return next(err)
      응답.redirect('/')
    })
  })(요청, 응답, next)
})

passport.serializeUser((user, done) => {
  console.log(user)
  process.nextTick(() => { // 내부코드를 비동기적으로 처리해줌
    done(null, { id: user._id, username: user.username }) ///요청.logIn() 162번줄, 쓰면 자동실행
  })
})

passport.deserializeUser(async (user, done) => {
  let result = await db.collection('user').findOne({_id : new ObjectId
  (user.id)})
  delete result.password
  process.nextTick(()=>{
    done(null,result)
  })
  
})

//회원가입 기능
app.get('/register', (요청, 응답) =>{
  응답.render('register.ejs')
})

app.post('/register', async (요청, 응답) =>{

  let 해시 = await bcrypt.hash(요청.body.password, 10 )
  // console.log(해시)
  await db.collection('user').insertOne({
    username : 요청.body.username,
    password : 해시
  })
  응답.redirect('/')
})


//그냥 해논거
app.get('/shop',(요청, 응답) =>{
    응답.send('쇼핑페이지')
})
app.get('/about', (요청, 응답) =>{
    응답.send('자기소개하세요: 0g0이에요')
})
// app.get('/shop', function(요청, 응답){
//     응답.send('쇼핑페이지')
// }) //콜백함수 : 다른함수 파라미터에 들어가는 함수 
//shop 접속시 app.get()함수 실행 그 후 콜백함수 실행됨.

//현재 시간요청
app.get('/time', (요청, 응답)=>{
    응답.render('time.ejs', { data : new Date()})
})




let db
const url = 'mongodb+srv://sparta:aaaa4321@cluster0.mcun02k.mongodb.net/?retryWrites=true&w=majority'
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum');
  app.listen(8080, () =>{
    console.log('http://localhost:8080에서 서버 실행')
})
}).catch((err)=>{
  console.log(err)
})

