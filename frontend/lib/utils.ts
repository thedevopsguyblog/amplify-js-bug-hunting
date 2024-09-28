import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function logger(fileName: string, fnName:string | undefined,  message: string, level: 'error' | 'debug') {
  switch (level) {
    case 'error':
      console.error(`[${fileName}] - [${fnName}] - ${message}`)
      break;
    case 'debug':
      console.debug(`[${fileName}] - [${fnName}] - ${message}`)
      break;
  }
}



//Move commons functions like local storage, cookies, etc here