import Image from "next/image";
import styles from "./page.module.css";

const Page = (): JSX.Element => {
  return (
    <main className={styles.main}>
      <div className={styles.logoContainer}>
        <Image
          alt="pue.js"
          className={styles.logo}
          sizes="100vw"
          style={{
            width: "100%",
            height: "auto",
          }}
          width={590}
          height={185}
          src="/puejs.png"
        />
      </div>
      <p className={styles.soon}>SOON</p>
    </main>
  );
};

export default Page;
