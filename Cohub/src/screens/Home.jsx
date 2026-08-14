import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="text-right min-h-screen flex flex-col justify-center gap-4 px-4">
      <Link
        to="/cohub"
        className="border border-border bg-card rounded-lg p-6 flex flex-col gap-1"
      >
        <span className="text-xl font-bold text-foreground">Cohub</span>
        <span className="text-base text-muted-foreground">ניהול פרויקטים ולוח זמנים</span>
      </Link>
      <Link
        to="/catalog"
        className="border border-border bg-card rounded-lg p-6 flex flex-col gap-1"
      >
        <span className="text-xl font-bold text-foreground">קטלוג קורסים</span>
        <span className="text-base text-muted-foreground">דרגו וגלו קורסים</span>
      </Link>
    </div>
  )
}
