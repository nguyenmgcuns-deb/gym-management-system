// Weight moved for one exercise row: sets x reps x kg (bodyweight rows count as 0).
export function volumeOf(item) {
  return item.weight ? item.sets * item.reps * item.weight : 0
}
