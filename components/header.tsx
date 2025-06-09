import { ThemeToggle } from "./theme-toggle"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

export default function Header() {
  return (
    <header className="flex w-full items-center justify-between px-6 py-4">
      <div className="font-bold text-xl dark:text-white">LUCRA</div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Button className="flex items-center gap-2 bg-[#6B48FF] hover:bg-[#5a3dd9] text-white rounded-full px-4 py-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      </div>
    </header>
  )
}
