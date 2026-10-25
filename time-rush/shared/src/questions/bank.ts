// Question bank: 47 questions in simple English, following the presentation's slides. A game of 20 rounds uses 40 of them
// (one per team per round, never repeated). Correct answers are spread over A, B and C.

import type { AnswerId, Difficulty, Question } from '../types/game';

type Entry = [id: string, topic: string, question: string, a: string, b: string, c: string, correct: AnswerId, explanation: string, difficulty: Difficulty];

const ENTRIES: Entry[] = [
  // From the presentation: what time management is and why it matters
  ['basics-01', 'What is time management?', 'What is time management?', 'Doing everything as fast as possible', 'Planning your time and spending it on what really matters', 'Working without any rest', 'B', 'Time management is planning your time and using it for the things that really matter.', 'easy'],
  ['basics-02', 'What is time management?', 'Which are the four steps of time management?', 'Sleep, eat, play, repeat', 'Wait, hurry, panic, forget', 'Plan, prioritize, focus, review', 'C', 'Plan first, choose what matters, focus on one task and then review what worked.', 'medium'],
  ['basics-03', 'What is time management?', 'How many hours does everyone have in a day?', '12 hours', '24 hours, the same for everyone', 'Busy people get more', 'B', 'Everyone has the same 24 hours — the difference is how we use them.', 'easy'],
  ['benefits-01', 'Why it matters', 'Which is a benefit of good time management for students?', 'More stress before deadlines', 'Studying all night', 'Less stress and more free time', 'C', 'A good plan means less stress and time left for friends, sport and hobbies.', 'easy'],
  ['priorities-06', 'Setting priorities', 'Your exam is tomorrow. Which square of the Eisenhower Matrix is it?', 'Do now', 'Drop', 'Limit', 'A', 'Important and urgent: do it now.', 'medium'],
  ['priorities-07', 'Setting priorities', 'Most messages and some calls are urgent but not important. What should you do with them?', 'Do them first, all day', 'Limit them', 'Plan them for next year', 'B', 'Urgent but not important tasks should take as little time as possible.', 'hard'],
  ['wasters-01', 'Common time wasters', 'What is the best fix for "no clear plan"?', 'Hope for the best', 'Write a to-do list every evening', 'Ask friends what to do every hour', 'B', 'A list written in the evening makes the next day clear.', 'easy'],
  ['balance-01', 'Study, rest and sleep', 'In a balanced example day, how many hours are for sleep?', 'About 4 hours', 'About 12 hours', 'About 8 hours', 'C', 'A good day has about 8 hours of sleep, 8 of study, and the rest for meals, sport and free time.', 'medium'],

  // Planning your day
  ['planning-01', 'Planning your day', 'What is the best way to organize your day?', 'Make a daily plan', 'Ignore your deadlines', 'Do everything at the last minute', 'A', 'A daily plan helps you organize tasks and use your time wisely.', 'easy'],
  ['planning-02', 'Planning your day', 'When is a good time to plan tomorrow?', 'Five minutes before class', 'In the evening, the day before', 'Never', 'B', 'Planning the evening before lets you start the next day with a clear list.', 'easy'],
  ['planning-03', 'Planning your day', 'What should a to-do list have?', 'Only fun things', 'Nothing, just remember it', 'Clear tasks you can finish', 'C', 'Clear, small tasks are easy to start and easy to check off.', 'easy'],
  ['planning-04', 'Planning your day', 'You have a free hour between classes. What is a smart plan?', 'Do a small homework task', 'Scroll social media all hour', 'Sleep on the desk', 'A', 'Short free periods are perfect for small tasks.', 'medium'],
  ['planning-05', 'Planning your day', 'Why should you plan time for rest too?', 'Rest is a waste of time', 'Rest helps you work better later', 'Plans are only for work', 'B', 'Planned rest keeps your energy up for the next task.', 'medium'],

  // Setting priorities
  ['priorities-01', 'Setting priorities', 'You have an exam tomorrow and a new series to watch. What do you do first?', 'Watch the whole series', 'Study for the exam', 'Do both at the same time', 'B', 'Important and urgent tasks come first. The series can wait.', 'easy'],
  ['priorities-02', 'Setting priorities', 'In the Eisenhower Matrix, what do you do with tasks that are not urgent and not important?', 'Drop them', 'Do them first', 'Do them every hour', 'A', 'Tasks that are neither urgent nor important only steal your time.', 'hard'],
  ['priorities-03', 'Setting priorities', 'What does "prioritize" mean?', 'Do the easiest task only', 'Do tasks in random order', 'Do the most important task first', 'C', 'To prioritize means to put the most important things first.', 'easy'],
  ['priorities-04', 'Setting priorities', 'A task is important but not urgent. What should you do?', 'Plan a time for it', 'Forget about it', 'Give it to a friend', 'A', 'Important tasks need a planned time, before they become urgent.', 'hard'],
  ['priorities-05', 'Setting priorities', 'You have three tasks. Which one should you start with?', 'The one with the closest deadline', 'The most boring one, never', 'The one your friend likes', 'A', 'The closest deadline usually needs your attention first.', 'medium'],

  // Avoiding procrastination
  ['procrastination-01', 'Avoiding procrastination', 'A task feels too big to start. What helps?', 'Wait until you feel ready', 'Start it the night before the deadline', 'Break it into small steps', 'C', 'Small steps are easier to start, and each finished step keeps you moving.', 'easy'],
  ['procrastination-02', 'Avoiding procrastination', 'What is procrastination?', 'Working very fast', 'Putting tasks off until later', 'Planning your week', 'B', 'Procrastination means delaying things you know you should do.', 'easy'],
  ['procrastination-03', 'Avoiding procrastination', 'Which trick helps you start a boring task?', 'Work on it for just 5 minutes', 'Wait for motivation', 'Watch videos first', 'A', 'Once you start for 5 minutes, it is much easier to continue.', 'medium'],
  ['procrastination-04', 'Avoiding procrastination', 'What often happens when you leave homework for the last night?', 'You get more free time', 'Nothing changes', 'You feel stressed and sleep less', 'C', 'Last-minute work brings stress and short sleep.', 'easy'],

  // Study schedules
  ['schedule-01', 'Study schedules', 'Which study schedule usually works better?', 'A little every day', 'Ten hours the day before the exam', 'Only when you are in the mood', 'A', 'Regular short sessions help you remember more than one long night of cramming.', 'medium'],
  ['schedule-02', 'Study schedules', 'What should a weekly study schedule include?', 'Only free time', 'Study time, breaks and rest days', 'Only exam dates', 'B', 'A good schedule balances study, breaks and rest.', 'medium'],
  ['schedule-04', 'Study schedules', 'Your exam is in two weeks. When should you start studying?', 'Now, a little every day', 'The night before', 'After the exam', 'A', 'Starting early lets you study calmly and review everything.', 'easy'],

  // Breaks and concentration
  ['breaks-01', 'Breaks and concentration', 'In the Pomodoro Technique, how long is one focus session?', '5 minutes', '25 minutes', '3 hours', 'B', 'A Pomodoro is 25 minutes of focus followed by a 5-minute break.', 'easy'],
  ['breaks-02', 'Breaks and concentration', 'After four Pomodoros, what should you do?', 'Stop studying forever', 'Start four more at once', 'Take a longer break', 'C', 'After four rounds, a 15–30 minute break helps your brain rest.', 'medium'],
  ['breaks-03', 'Breaks and concentration', 'Does doing many tasks at once save time?', 'Yes, always', 'Only for homework', 'No, switching tasks wastes time', 'C', 'Every switch costs time and attention. Finish one task, then start the next.', 'medium'],
  ['breaks-04', 'Breaks and concentration', 'What is a good short break?', 'Stretch and drink water', 'Start a long video series', 'Play games for two hours', 'A', 'A short active break refreshes you without eating your study time.', 'easy'],
  ['breaks-05', 'Breaks and concentration', 'Why are short breaks useful?', 'They make you lazy', 'They help you focus again', 'They are not useful', 'B', 'Short breaks give your brain energy to focus again.', 'easy'],

  // Time management tools
  ['tools-01', 'Time management tools', 'Which tool helps you remember deadlines?', 'A game app', 'A music playlist', 'A calendar or planner', 'C', 'A calendar or planner shows all your deadlines in one place.', 'easy'],
  ['tools-02', 'Time management tools', 'What can a timer help you with?', 'Stay focused for a set time', 'Make tasks disappear', 'Skip classes', 'A', 'A timer helps you work in focused blocks, like Pomodoros.', 'easy'],
  ['tools-03', 'Time management tools', 'What does a reminder on your phone do?', 'Does your homework', 'Tells you about a task at the right time', 'Deletes your tasks', 'B', 'Reminders help you not forget important things.', 'easy'],

  // Goals and deadlines
  ['goals-01', 'Goals and deadlines', 'Which goal is the clearest?', 'Read two chapters by Friday', 'Study more someday', 'Be a better student', 'A', 'A clear goal says what to do and when to finish it.', 'medium'],
  ['goals-03', 'Goals and deadlines', 'A project is due in a month. What is a good idea?', 'Do it all on the last day', 'Set small deadlines for each part', 'Forget it for three weeks', 'B', 'Small deadlines for each part keep a big project on track.', 'medium'],

  // Homework planning
  ['homework-01', 'Homework planning', 'What helps you finish homework on time?', 'Waiting for the weekend', 'A fixed homework time every day', 'Doing it during other classes', 'B', 'A fixed time every day turns homework into a habit.', 'easy'],
  ['homework-02', 'Homework planning', 'You get homework on Monday, due Friday. When should you start?', 'Friday morning', 'Thursday night', 'Early in the week', 'C', 'Starting early leaves time to ask questions and fix mistakes.', 'easy'],
  ['homework-03', 'Homework planning', 'What should you do first when you get a lot of homework?', 'Make a list and order it', 'Panic', 'Do none of it', 'A', 'A list in the right order turns a big pile into clear steps.', 'easy'],
  ['homework-04', 'Homework planning', 'You don’t understand a homework task. What is best?', 'Skip it and say nothing', 'Ask the teacher or a classmate early', 'Copy a friend’s work', 'B', 'Asking early saves time and helps you really learn.', 'medium'],

  // Distractions
  ['distractions-01', 'Distractions', 'Where should your phone be while you study?', 'In your hand', 'Next to your book with sound on', 'In another room or in a bag', 'C', 'Even a silent phone on the desk can pull your attention away.', 'easy'],
  ['distractions-02', 'Distractions', 'Which is the biggest distraction while studying?', 'A quiet room', 'Notifications on your phone', 'A glass of water', 'B', 'Every notification breaks your focus.', 'easy'],
  ['distractions-03', 'Distractions', 'How can you stop social media from stealing your time?', 'Turn off notifications', 'Check it every 5 minutes', 'Keep the app open', 'A', 'Without notifications, you decide when to check the apps.', 'medium'],
  ['distractions-04', 'Distractions', 'What is the best place to study?', 'In bed with the TV on', 'A quiet place with a clean desk', 'A noisy café with friends', 'B', 'A quiet, tidy place helps you concentrate.', 'easy'],

  // Healthy study habits
  ['habits-01', 'Healthy study habits', 'How many hours of sleep do most students need?', '3 to 4 hours', '7 to 9 hours', '12 to 14 hours', 'B', 'Seven to nine hours of sleep help your brain remember what you learned.', 'medium'],
  ['habits-02', 'Healthy study habits', 'Is studying all night before an exam a good idea?', 'Yes, it is the best way', 'Only with coffee', 'No, sleep helps memory', 'C', 'During sleep the brain stores what you learned.', 'medium'],
  ['habits-04', 'Healthy study habits', 'Why is sport good for students?', 'It wastes study time', 'It gives energy and reduces stress', 'It is only for athletes', 'B', 'Exercise gives energy and helps you relax.', 'easy'],
  ['habits-05', 'Healthy study habits', 'What should you do the hour before sleep?', 'Play exciting games', 'Drink a lot of coffee', 'Put the phone away and relax', 'C', 'Less screen time before bed helps you fall asleep faster.', 'medium'],
];

export const QUESTION_BANK: readonly Question[] = ENTRIES.map(([id, topic, question, a, b, c, correctAnswer, explanation, difficulty]) => ({
  id,
  topic,
  question,
  answers: [
    { id: 'A', text: a },
    { id: 'B', text: b },
    { id: 'C', text: c },
  ] as const,
  correctAnswer,
  explanation,
  difficulty,
}));
