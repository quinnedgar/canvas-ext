const NGROK_CURRENT = 'https://96eb-2601-1c0-847f-af0-6c09-e6a5-aa13-f1c4.ngrok-free.app/receive';
const LOCALHOST = "http://localhost:5000/receive"


class Question {
    constructor(text) {
        this.text = text || '';
        this.lines = this.text.split('\n');
        this.question = this.lines[0];
        this.options = this.lines.slice(2);
    }
    getText() {
        console.log(`QUESTION: ${this.question}`);
        console.log(`OPTIONS: ${this.options}`);
        return;
    }
}

class SelectionPackage{
    constructor(id, content){
        this.content = content;
        this.id = id;
    }
}


function searchForPrompts(timeout = 10000) {
    return new Promise((resolve, reject) => {
        let intervalTime = 100;
        let maxAttempts = timeout / intervalTime;
        let attempts = 0;

        let interval = setInterval(() => {
            let elements = Array.from(document.getElementsByClassName('text')).filter(function(el) {
                return el.offsetParent !== null;  
            });

            if (elements.length > 0) {
                clearInterval(interval);
                resolve(elements);
                }

            if (++attempts > maxAttempts) {
                clearInterval(interval);
                reject(new Error('Failed to access elements'));
            }


        }, intervalTime);
    });
}

function queryAPI(question, choices, n){
    let url = LOCALHOST;
    let data = {
        question: question,
        choices: choices
    };

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log(`API Response ${n}:`, (data['answer'] ? data['answer'] : data['response']));
    })
    .catch(error => {
        console.error('Error querying API:', error);
    });
}

async function dynamicSelection(id, answer){
    //concat the idNum and answerName to create the id
    //check if in document
    //id = question_564_answer_51
    //class = .question_input
    let ans = document.getElementById(id);
    if (ans.startswith(id)){
        return ans;
    }
}

function getQuestionId(div) {
    let allDivs = div.querySelectorAll("div");
    for (let childDiv of allDivs) {
        if (childDiv.id) {
            questionId = childDiv.id.match(/question_(\d+)_question_text/);
            return questionId[0]; 
        }
    }
}

function getRadio(div){
    let divPackages = [];
    let unpackaged = []
    let radios = div.querySelectorAll('input[type="radio"]');
    let labels = div.querySelectorAll('.answer_label');
    let n = 0;

    for (let div of radios) {
        let id = div.id;
        let label = labels[n].innerText
        divPackages.push(new SelectionPackage(id, label));
        n+= 1;
    }
    return divPackages;
    //return (`RADIOS: ${radios.length} LABELS: ${labels.length}`);
}



async function main(){
    try{
        const elements = await searchForPrompts(10000);
        let n = 0;
        for (const el of elements) {
            n += 1;
            /*
            let q = new Question(el.innerText);
            await queryAPI(q.question, q.options, n);*/
            let packages = getRadio(el);
            for (const pkg of packages) { // Iterate over the array
                console.log(`divTEXTID ${n}: ID: ${pkg.id}  TEXT: ${pkg.content}`);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

main();
