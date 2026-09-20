import styles from "./how-it-works.module.css";

const steps = [
  {
    title: "Избор на услуга или абонамент",
    description:
      "Изберете почистване, домашен ремонт или абонаментна грижа според нуждите на дома ви.",
    icon: "M4 6h16M4 12h10M4 18h7M18 14v6m-3-3h6",
  },
  {
    title: "Проверен специалист на адрес",
    description:
      "DOMORA намира надежден изпълнител, за да не губите време в групи и обяви.",
    icon: "M12 3 5 6v5c0 4.4 3 7.7 7 10 4-2.3 7-5.6 7-10V6l-7-3Zm-3 9 2 2 4-4",
  },
  {
    title: "Лесно плащане и спокойствие",
    description:
      "Следете заявката, плащайте сигурно и оставете редовната грижа на нас.",
    icon: "M3 7h18v12H3V7Zm0 4h18M7 15h3",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className={styles.section}
      aria-labelledby="how-it-works-title"
    >
      <div className={styles.intro}>
        <p className={styles.eyebrow}>ТРИ ЛЕСНИ СТЪПКИ</p>
        <h2 id="how-it-works-title">Как работи DOMORA</h2>
        <p>
          От първия избор до свършената работа — всичко е ясно, проследимо и
          подредено.
        </p>
      </div>

      <ol className={styles.steps}>
        {steps.map((step, index) => (
          <li key={step.title} className={styles.step}>
            <div className={styles.stepHeader}>
              <span className={styles.icon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d={step.icon}
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className={styles.number} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
