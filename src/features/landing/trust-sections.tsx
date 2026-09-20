import { LandingIcon } from "./landing-icon";
import styles from "./trust-sections.module.css";

const testimonials = [
  {
    initials: "МП",
    name: "Мария Петрова",
    context: "Абонамент за дома",
    quote:
      "Екипът идва точно навреме, а след всяко посещение знам какво е свършено. Домът ни най-после има постоянен ритъм.",
  },
  {
    initials: "НИ",
    name: "Николай Иванов",
    context: "Домашен ремонт",
    quote:
      "Получих ясна цена предварително и специалистът остави всичко чисто. Нямаше изненади и губене на време.",
  },
  {
    initials: "ЕЛ",
    name: "Елена Лазарова",
    context: "Поддръжка на вход",
    quote:
      "Общите части са поддържани по график и вече не напомняме за всяко посещение. Комуникацията е спокойна и лесна.",
  },
];

const benefits = [
  {
    title: "Застраховка на имуществото",
    description:
      "Услугите са покрити, за да сте спокойни за дома си по време на всяко посещение.",
    icon: "M12 3 5 6v5c0 4.4 3 7.7 7 10 4-2.3 7-5.6 7-10V6l-7-3Z",
  },
  {
    title: "Фиксирани прозрачни цени",
    description:
      "Виждате обхвата и цената преди потвърждение, без скрити такси след работата.",
    icon: "M4 6h16v12H4V6Zm4 4h8m-8 4h5",
  },
  {
    title: "Проверени специалисти с рейтинг",
    description:
      "Всеки изпълнител минава проверка, а обратната връзка помага да пазим висок стандарт.",
    icon: "m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z",
  },
];

const questions = [
  {
    question: "Как се извършва плащането?",
    answer:
      "Плащате сигурно след потвърждение на услугата. Винаги виждате крайната цена и обхвата предварително.",
  },
  {
    question: "Какво става, ако трябва да сменя деня?",
    answer:
      "Можете да заявите промяна през профила си. Ще предложим най-близкия свободен час според графика на специалиста.",
  },
  {
    question: "Включени ли са препаратите?",
    answer:
      "При абонаментното почистване стандартните препарати са включени. За специални повърхности уточняваме нужните продукти предварително.",
  },
];

export function TrustAndTestimonials() {
  return (
    <section className={styles.trustSection} aria-labelledby="trust-title">
      <div className={styles.sectionHeading}>
        <p>СПОКОЙСТВИЕ ВЪВ ВСЯКА СТЪПКА</p>
        <h2 id="trust-title">Защо да изберете DOMORA</h2>
      </div>

      <ul className={styles.benefits}>
        {benefits.map((benefit) => (
          <li key={benefit.title}>
            <span className={styles.benefitIcon}>
              <LandingIcon path={benefit.icon} />
            </span>
            <div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className={styles.testimonialHeading}>
        <p>ИСТОРИИ ОТ ДОМОВЕ, ЗА КОИТО СЕ ГРИЖИМ</p>
        <h3>Доверие, изградено с добре свършена работа</h3>
      </div>
      <div className={styles.testimonials}>
        {testimonials.map((testimonial) => (
          <article key={testimonial.name}>
            <div className={styles.rating} aria-label="Оценка: 5 от 5">
              <span aria-hidden="true">★★★★★</span>
            </div>
            <blockquote>„{testimonial.quote}“</blockquote>
            <footer>
              <span className={styles.avatar} aria-hidden="true">
                {testimonial.initials}
              </span>
              <div>
                <strong>{testimonial.name}</strong>
                <span>{testimonial.context}</span>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section id="faq" className={styles.faq} aria-labelledby="faq-title">
      <div className={styles.faqIntro}>
        <p>ИМАТЕ ВЪПРОС?</p>
        <h2 id="faq-title">Често задавани въпроси</h2>
        <span>
          Събрахме най-важното, за да знаете какво да очаквате още преди първата
          заявка.
        </span>
      </div>
      <div className={styles.questions}>
        {questions.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
