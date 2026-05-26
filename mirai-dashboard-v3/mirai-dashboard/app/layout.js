import './globals.css';

export const metadata = {
  title: '미래인재실 주간 보고 | MIRAI',
  description: '미래인재실 주간업무 보고 대시보드',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
