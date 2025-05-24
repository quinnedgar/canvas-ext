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

async function queryAPIOld(question, choices, n){
    let url = LOCALHOST;
    let data = {
        question: question,
        choices: choices
    };

    const response = fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(async response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    })
    .then(data => {
        console.log(`API Response ${n}:`, (data['answer'] ? data['answer'] : data['response']));
    })
    .catch(error => {
        console.error('Error querying API:', error);
    });
}


async function queryAPI(question, choices, n) {
    let url = LOCALHOST;
    let data = {
        question: question,
        choices: choices
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const jsonData = await response.json();
        if (jsonData['answer']) {
            return jsonData['answer'];
        } else {
            console.log(`ERR Response ${n}:`, jsonData['response']);
            return null; 
        }
    } catch (error) {
        console.error('Error querying API:', error);
        return null; // Return null in case of an error
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

async function compare(answers, response){

}



async function main(){
    try{
        const elements = await searchForPrompts(10000);
        let n = 0;
        for (const el of elements) {
            n += 1;
            let q = new Question(el.innerText);
            data = await queryAPI(q.question, q.options, n);
            if (data) {
                console.log(`API Response ${n}: ${data}`);
            } else {
                console.error(`No valid answer received for question ${n}`);
                continue; // Skip to the next iteration if no valid data is received
            }
            let packages = getRadio(el);
            for (const pkg of packages) {
                if (data == pkg.content){
                    console.log(`Selected: [${pkg.content}] with ID: ${pkg.id}`);
                } else {
                    if (n==9 || pkg.content.length == 40){

                        //FOR LATER: This issue occurs because pkg.content contains the unicode invisible chars 173 and 32, remnant of when they were sanitized in the API
                        console.log(`DATA: [${data.length}], PKG: [${pkg.content.length}]`);
                        for (let i = 0; i < Math.max(data.length, pkg.content.length); i++) {
                            console.log(`Index ${i} DATA = ${data.charAt(i)}: (${data.charCodeAt(i)}) | PKG CONTENT = ${pkg.content.charAt(i)} (${pkg.content.charCodeAt(i)})`);
                        }
                    }

                }
            }
        }
    } catch (err) {
        console.error(err);
    }
}

main();
