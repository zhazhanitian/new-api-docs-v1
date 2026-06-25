interface FooterProps {
  lang: string;
}

export function Footer({ lang }: FooterProps) {
  return (
    <footer className="border-fd-border bg-fd-card/30 mt-auto border-t backdrop-blur-sm">
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <div className="text-fd-muted-foreground flex flex-col gap-1 text-xs">
          <p>© 2026 南京白鲸汇智能科技有限公司. All Rights Reserved.</p>
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-fd-foreground transition-colors"
            >
              苏ICP备2026028558号-1
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
