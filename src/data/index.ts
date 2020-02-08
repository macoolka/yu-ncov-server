import toDB from './updateData'
import * as Task from 'fp-ts/lib/Task'
import { pipe } from 'fp-ts/lib/pipeable'
import { scrapeToRecord } from 'yu-ncov-scrape-dxy'
import createLogger from 'macoolka-log'
import { showUnknow } from 'macoolka-object'
import { writeFileSync } from 'fs'
import { join } from 'path'
import * as dateFns from 'date-fns';
import { formatJson } from 'macoolka-prettier'
import { timer } from 'rxjs';
const timerUpdate=()=>{

    const filename = (a: Date) => `ncov_${dateFns.format(a, 'yyyy_MM_dd')}.json`;
    const logger = createLogger()
    const numbers = timer(3000, 10 * 60 * 1000);
    numbers.subscribe(x => pipe(
        scrapeToRecord,
        Task.chainFirst((a) => async () => {
            logger.info(`get new data at ${dateFns.format(a.countries[0].recordAt, 'yyyy-MM-dd HH:mm')}`)
            const name = join(__dirname, '..', '..','backup', 'data', filename(a.countries[0].recordAt))
            writeFileSync(name, formatJson(a))
            logger.info(`data save to ${name}`)
        }),
        Task.chain(a => toDB(a)),
        Task.map(() => logger.info(`data save to database`))
    )().catch(a => {
        logger.error(showUnknow.show(a))
    })); 
}
export default timerUpdate