import Head from 'next/head';
import Link from 'next/link';
import { PostsProps } from 'pages/posts';
import styles from './styles.module.scss';

export function PostsTemplate({ publications }: PostsProps) {
  return (
    <>
      <Head>
        <title>Posts | ig.news</title>
      </Head>
      <main className={styles.container}>
        <div className={styles.posts}>
          {publications.map((publication) => (
            <Link href={`/posts/${publication.slug}`} key={publication.slug}>
              <a>
                <time>
                  {new Intl.DateTimeFormat('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }).format(new Date(publication.createdAt))}
                </time>
                <strong>{publication.title}</strong>
                <p>{publication.description}</p>
              </a>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
