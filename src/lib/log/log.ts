import chalk from 'chalk';
export default function println(sender: string, str: string) {
  const time = new Date().toISOString();
  // tslint:disable-next-line:no-console
  console.log(`[${chalk.gray(time)} | ${chalk.gray(sender)}] ${str}`);
}

export function forSender(sender: string): (str: string) => void {
  return (str) => {
    println(sender, str);
  };
}
