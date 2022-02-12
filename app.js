const session = require("express-session");
const express = require("express");
const exphbs = require('express-handlebars');
const he = require("he");
const path = require("path");
const axios = require("axios");
const app = express();
const port = 8080;

const hbs = exphbs.create({ defaultLayout: 'main', extname: '.hbs' })

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded());

app.use(session({
    secret: "This is my funky secret.",
    resave: false,
    saveUninitialized: true,
    secure: true
}));

function shuffleArray(array){
    for(let i = array.length -1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

app.get('/', async (req, res) => {
    if(!req.session.init || req.session.nextQuestion){
        req.session.init = true
        req.session.nextQuestion = false;
        let quizData = await axios.get("https://opentdb.com/api.php?amount=1&difficulty=easy");

        quizData = quizData.data.results;
        let answers = [];
        for(const answer of quizData[0].incorrect_answers){
            answers.push(he.decode(answer));
        }
        answers.push(he.decode(quizData[0].correct_answer));
    
        shuffleArray(answers);
        req.session.question = quizData[0].question;
        req.session.answers = answers;
        req.session.correct_answer = quizData[0].correct_answer;
    }

    res.render('index', {
        question: he.decode(req.session.question),
        answers: req.session.answers
    });

});

app.post('/check_answer', async (req, res) => {
    let answer = req.body.answer;
    let correctAnswer = req.session.correct_answer;

    req.session.nextQuestion = true;

    res.render('result', {
        correct: answer == correctAnswer,
        correctAnswer: correctAnswer
    });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});