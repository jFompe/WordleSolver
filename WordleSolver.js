const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const { filter } = require('selenium-webdriver/lib/promise');
const JSDOM = require('jsdom').JSDOM

const driver = new Builder().forBrowser('chrome').build()

const words = fs.readFileSync('clean.txt', 'utf-8')
let wordsList = words.split('\r\n')

const goToWeb = async () => {
  const URL = 'https://wordle.danielfrg.com/'
  await driver.get(URL)
}
const closeHelp = async () => {
  const X_BUTTON = '/html/body/div[2]/div/div/div/div[2]/h3/button'
  await driver.findElement(By.xpath(X_BUTTON)).click()
}
const clickButton = async text => {
  let tecla = await driver.wait(until.elementLocated(By.css(`[aria-label="${text}"]`)), 1000)
  await tecla.click()
}
const randomWordFromList = words => words[Math.floor(Math.random()*words.length)]

const wordResults = async row => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const doc = new JSDOM(await driver.getPageSource())
  return Array.from(
    doc.window.document.getElementsByClassName('grid grid-rows-6')[0].childNodes[row].childNodes)
    .map(el => el.innerHTML.split(' ')
    .filter(s => s.startsWith('bg-')))
    .flat()
    .map(s => s.split('"')[0].substring(3))
}
const getWordResultsDict = async (letters, row) => {
  const results = await wordResults(row)
  const resultsDict = { 'correct': {}, 'present': {}, 'absent': {} }
  letters.forEach((l,i) => {
    resultsDict[results[i]][i] = l
  })
  return resultsDict
}
const filterWords = (words, { correct, present, absent }) => {
  Object.keys(absent).forEach(k => {
    if ([...Object.values(correct), ...Object.values(present)].includes(absent[k])) {
      present[k] = absent[k]
      delete absent[k]
    }
  })
  // const letters = [...Object.values(correct), ...Object.values(present)]
  // let lettersReps = {}
  // for (const l of letters) {
  //   lettersReps[l] = lettersReps[l] ? lettersReps[l] + 1 : 1;
  // }
  // Object.keys(lettersReps).forEach(l => {
  //   if (lettersReps[l] == 1) {
  //     delete lettersReps[l]
  //   }
  // })
  return words
    // .filter(w => Object.keys(lettersReps).every(k => 5 - w.replaceAll(k, '').length == lettersReps[k]))
    .filter(w => Object.values(absent).every(l => !w.includes(l)))
    .filter(w => Object.keys(present).every(k => w.includes(present[k]) && present[k] != w[k]))
    .filter(w => Object.keys(correct).every(k => w[k] == correct[k]))
}

const removeLettersFromWord = (word, letters) => {
  letters.forEach(l => {
    word = word.replace(l, '')
  })
  return word
}

const filterWords2 = (words, { correct, present, absent }) => {
  let filterPattern = {0:null, 1:null, 2:null, 3:null, 4:null}
  let filterStr = ''
  Object.keys(correct).forEach(k => filterPattern[k] = correct[k])
  Object.keys(filterPattern).filter(k => filterPattern[k] == null).forEach(k => {
    filterPattern[k] = []
  })
  Object.keys(present).forEach(k => { filterPattern[k].push(present[k]) })
  Object.keys(absent).forEach(k => Object.keys(filterPattern).filter(l => filterPattern[l] instanceof Array).forEach(l => {
    filterPattern[l].push(absent[k])
  }))

  for (let i = 0; i < 5; i++) {
    filterStr += filterPattern[i] instanceof Array 
      ? '[^'+ filterPattern[i].join('') + ']'
      : filterPattern[i]
  }
  console.log('PAT:', filterStr)
  return words.filter(w => w.match(new RegExp(filterStr)) && Object.values(present).every(l => removeLettersFromWord(w, Object.values(correct)).includes(l)))
}

const removeWord = word => {
  const delWords = fs.readFileSync('clean.txt', 'utf-8')
  let delList = delWords.split('\r\n')
  delList.splice(delList.indexOf(word), 1)
  fs.writeFileSync('clean.txt', delList.join('\r\n'),'utf-8')
}
const deleteWord = async () => {
  for (let index = 0; index < 6; index++) {
    await clickButton('borrar letra')
  }
}


const solve = async () => {
  try {
    await goToWeb()
    await closeHelp()

    let lettersDict
    for (let tries = 0; tries < 6; tries++) {
      let word = randomWordFromList(wordsList)
      let letters = word.split('')
      letters.forEach(async l => {
        await clickButton(l)
      })
      try {
        await clickButton('procesar palabra')
        lettersDict = await getWordResultsDict(letters, tries)
        if (Object.keys(lettersDict['correct']).length == 5) break
        wordsList = filterWords2(wordsList, lettersDict)
      } catch (error) {
        console.log('ERROR!!!!!!!!!!!!!!!');
        console.log(error);
        wordsList.splice(wordsList.indexOf(word), 1)
        await deleteWord()
        tries--
        removeWord(word)
      }
      console.log('Remaining words:', wordsList.length)
      console.log(wordsList)
      console.log('---------------------');

    }

  } catch (error) {
    console.log(error);
  }

}

solve()
