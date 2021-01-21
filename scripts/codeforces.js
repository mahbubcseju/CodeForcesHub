/* Commit messages */
const readmeMsg = 'Create README - CodeforcesHub';
const discussionMsg = 'Prepend discussion post - CodeforcesHub';

/* Difficulty of most recenty submitted question */
let difficulty = '';

/* Main function for uploading code to GitHub repo */
const upload = (token, hook, code, directory, filename, sha, msg) => {
  // To validate user, load user object from GitHub.
  const URL = `https://api.github.com/repos/${hook}/contents/${directory}/${filename}`;

  /* Define Payload */
  let data = {
    message: msg,
    content: code,
    sha,
  };

  data = JSON.stringify(data);

  const xhr = new XMLHttpRequest();
  xhr.addEventListener('readystatechange', function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200 || xhr.status === 201) {
        const updatedSha = JSON.parse(xhr.responseText).content.sha; // get updated SHA.

        chrome.storage.sync.get('stats', (data2) => {
          let { stats } = data2;
          if (stats === null || stats === {} || stats === undefined) {
            // create stats object
            stats = {};
            stats.solved = 0;
            stats.sha = {};
          }
          const filePath = directory + filename;
          // Only increment solved problems statistics once
          // New submission commits twice (README and problem)
          if (sha === null) {
            stats.solved += 1;
          }
          stats.sha[filePath] = updatedSha; // update sha key.
          chrome.storage.sync.set({ stats }, () => {
            console.log(
              `Successfully committed ${filename} to github`,
            );
          });
        });
      }
    }
  });
  xhr.open('PUT', URL, true);
  xhr.setRequestHeader('Authorization', `token ${token}`);
  xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
  xhr.send(data);
};

function uploadGit(
  code,
  problemName,
  fileName,
  msg,
  action,
  prepend = true,
) {
  /* Get necessary payload data */
  chrome.storage.sync.get('codeforceshub_token', (t) => {
    const token = t.codeforceshub_token;
    if (token) {
      chrome.storage.sync.get('mode_type', (m) => {
        const mode = m.mode_type;
        if (mode === 'commit') {
          /* Get hook */
          chrome.storage.sync.get('codeforceshub_hook', (h) => {
            const hook = h.codeforceshub_hook;
            if (hook) {
              /* Get SHA, if it exists */

              /* to get unique key */
              const filePath = problemName + fileName;
              chrome.storage.sync.get('stats', (s) => {
                const { stats } = s;
                let sha = null;

                if (
                  stats !== undefined &&
                  stats.sha !== undefined &&
                  stats.sha[filePath] !== undefined
                ) {
                  sha = stats.sha[filePath];
                }

                if (action === 'upload') {
                  /* Upload to git. */
                  upload(
                    token,
                    hook,
                    code,
                    problemName,
                    fileName,
                    sha,
                    msg,
                  );
                } 
              });
            }
          });
        }
      });
    }
  });
}


/* Util function to check if an element exists */
function checkElem(elem) {
  return elem && elem.length > 0;
}

/* Parser function for time/space stats */
function getStats() {
  
  // Format commit message
  return `Time: ${time} (${timePercentile}), Space: ${space} (${spacePercentile}) - CodeForcesHUb`;
}

function UploadCode(element, problemName, language, solutionStats) {
  var codeUlr = element.getElementsByTagName('a')[0].getAttribute('href');
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      var doc = new DOMParser().parseFromString(this.responseText, "text/html");
      var code = doc.getElementById('program-source-text').innerText;
      setTimeout(
        function() {
          uploadGit(
            btoa(unescape(encodeURIComponent(code))),
            problemName,
            problemName + language,
            solutionStats,
            'upload',
          );
        },2000);
    }
  }
  xhttp.open('GET', `https://codeforces.com${codeUlr}`, true);
  xhttp.send();
}

function getLanguage(element) {
  return element.innerText;
}

function getProblemName(element) {
  return element.getElementsByTagName('a')[0].innerText;
}

function getStats(elements) {
  return elements.innerText;
}

function getVerdict(element) {
  return element.innerText;
}

const loader = setInterval(() => {
  let probStatement = null;
  let probStats = null;
  var location = window.location.href;
  var partLocation = location.split('/');
  if (partLocation.length > 0 && partLocation[partLocation.length -1] === 'my') {
    var elements = document.getElementsByClassName('datatable');
    if (elements.length > 0) {
      var mySubmissionElement = elements[0];
      var onlyPractices = mySubmissionElement.innerText.includes('My Submissions');
      if(onlyPractices) {
        var tableRows = mySubmissionElement.getElementsByTagName('tr');
        if (tableRows.length > 1) {
          var lastSubmission = tableRows[1];
          var columns = lastSubmission.getElementsByTagName('td');
          var language = getLanguage(columns[4]);
          var problemName = getProblemName(columns[3]);
          var solutionStats =  getStats(lastSubmission);
          var verdict = getVerdict(columns[5]);
          var iswaiting = columns[5].getAttribute('waiting');
          if (iswaiting === "false")  {
            clearTimeout(loader);
          }
          if (verdict.includes('Accepted')) {
            UploadCode(
              columns[0],
              problemName,
              language,
              solutionStats,
            )
          }
        }
      }
    }
  }
}, 1000);