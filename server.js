const express = require('express'); //express라이브러리 인용문
const { MongoClient, ObjectId } = require('mongodb');
const app = express()

app.use(express.static(__dirname + '/public'))
app.set('vew engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))

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

    // 게시글 추가
    await db.collection('post').insertOne({ title, content, created_at : new Date() });

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

//숙제?? 시간요청
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

