

const words = 'barco barca marca marco parca pasta tonto patas ratas nomas solas pocas banco banca namas ramon minas siman simar casas picas bacas bacar bacos bacel'.split(' ')
const filtro = { 'correct': {1: 'a', 0: 'b'}, 'present': {3:'c'}, 'absent': {2:'r',4:'o'} }



const filterWords = (words, { correct, present, absent }) => {
  return words
    .filter(w => Object.values(absent).every(l => !w.includes(l)))
    .filter(w => Object.keys(present).every(k => w.includes(present[k]) && present[k] != w[k]))
    .filter(w => Object.keys(correct).every(k => w[k] == correct[k]))
}


console.log(filterWords(words, filtro));