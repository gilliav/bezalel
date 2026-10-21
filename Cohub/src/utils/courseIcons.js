import grid from '../assets/subject-icons/grid.svg'
import ticTacToe from '../assets/subject-icons/tic-tac-toe-cropped.svg'
import pencil from '../assets/subject-icons/pencil.svg'
import candle from '../assets/subject-icons/candle.svg'
import chair from '../assets/subject-icons/chair-2.svg'
import book from '../assets/subject-icons/book.svg'
import gradCup from '../assets/subject-icons/grad-cup.svg'

// Subject icon per course, matched by the start of the course name so
// variants like 'רישום 03 - עיצוב (ספרינט)' still match.
const ICONS_BY_NAME = [
  ['גריד', grid],
  ['משחקיות', ticTacToe],
  ['רישום', pencil],
  ['דימוי', candle],
  ['סטודיו', chair],
  ['סיפור', book],
]

export function courseIcon(course) {
  const name = course?.name ?? ''
  return ICONS_BY_NAME.find(([prefix]) => name.startsWith(prefix))?.[1] ?? gradCup
}
