import { UsesAbilities } from './abilities';
import { Activity } from './Activity';
import { CollectsArtifacts } from './artifacts';
import { AnswersQuestions } from './questions';

/**
 * **Interactions** are low-level {@apilink Activity|activities} that encapsulate
 * a handful of instructions for an {@apilink Actor|actor} on how to use their {@apilink Ability|abilities}
 * to perform an individual interaction with the given interface of the system under test.
 *
 * :::tip Tasks or interactions?
 * Because of their low-level nature, interactions are named using the vocabulary of the [solution domain](https://blog.mattwynne.net/2013/01/17/the-problem-with-solutions/),
 * and represent an individual interaction with the given interface, e.g. {@apilink Click}, {@apilink Enter}, or {@apilink Send}.
 *
 * Interactions follow the [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single_responsibility_principle) which means that they do _one thing and one thing only_.
 * If you're considering implementing an "interaction" that performs more than one logical activity, e.g. checks if the button is visible and then clicks on it if is,
 * consider using separate interactions for separate responsibilities and then composing them using a {@apilink Task|task}.
 * :::
 *
 * Interactions are the core building block of the [Screenplay Pattern](/handbook/design/screenplay-pattern),
 * along with {@apilink Actor|Actors}, {@apilink Ability|Abilities}, {@apilink Question|Questions}, and {@apilink Task|Tasks}.
 *
 * ![Screenplay Pattern](/images/design/serenity-js-screenplay-pattern.png)
 *
 * Learn more about:
 * - {@apilink Actor|Actor}
 * - {@apilink Ability|Abilities}
 * - {@apilink Activity|Activities}
 *
 * ## Writing a custom interaction
 *
 * [Serenity/JS modules](/handbook/about/architecture) ship with dozens of interactions to help you compose your test scenarios.
 * However, if you need to interact with a non-standard interface, or want to create a flavour of a given interaction that behaves slightly differently than the built-in version,
 * you can easily create your own implementations using the {@apilink Interaction.where} factory method.
 *
 * ```ts
 * import { Actor, Interaction } from '@serenity-js/core'
 * import { BrowseTheWeb, Page } from '@serenity-js/web'
 *
 * export const ClearLocalStorage = () =>
 *   Interaction.where(`#actor clears local storage`, async (actor: Actor) => {
 *     // Interaction to ClearLocalStorage directly uses Actor's ability to BrowseTheWeb
 *     const page: Page = await BrowseTheWeb.as(actor).currentPage()
 *     await page.executeScript(() => window.localStorage.clear())
 *   })
 * ```
 *
 * ## Using a custom interaction
 *
 * ```ts
 * import { actorCalled } from '@serenity-js/core';
 * import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright'
 * import { By, Navigate, PageElement } from '@serenity-js/web'
 * import { Ensure, equals } from '@serenity-js/assertions'
 * import { Browser, chromium } from 'playwright'
 *
 * const browser = await chromium.launch({ headless: true })
 *
 * await actorCalled('Inês')
 *   .whoCan(BrowseTheWebWithPlaywright.using(browser))
 *   .attemptsTo(
 *     Navigate.to(`https://serenity-js.org`),
 *     ClearLocalStorage(), // reported as "Inês clears local storage"
 *   )
 * ```
 *
 * @group Screenplay Pattern
 */
export abstract class Interaction extends Activity {

    /**
     * @param description
     *  Description to be used when reporting this interaction, for example `#actor clears local storage`.
     *  Note that `#actor` will be replaced with the name of the actor performing this interaction.
     *
     * @param interaction
     */
    static where(
        description: string,
        interaction: (actor: UsesAbilities & AnswersQuestions & CollectsArtifacts) => Promise<void> | void,
    ): Interaction {
        return new DynamicallyGeneratedInteraction(description, interaction);
    }

    /**
     * Instructs the provided {@apilink Actor} to perform this {@apilink Interaction}.
     *
     * #### Learn more
     * - {@apilink Actor}
     * - {@apilink PerformsActivities}
     * - {@apilink UsesAbilities}
     * - {@apilink AnswersQuestions}
     *
     * @param actor
     */
    abstract performAs(actor: UsesAbilities & AnswersQuestions): Promise<void>;
}

/**
 * @package
 */
class DynamicallyGeneratedInteraction extends Interaction {
    constructor(
        description: string,
        private readonly interaction: (actor: UsesAbilities & AnswersQuestions & CollectsArtifacts) => Promise<void> | void,
    ) {
        super(description, Interaction.callerLocation(4));
    }

    performAs(actor: UsesAbilities & AnswersQuestions & CollectsArtifacts): Promise<void> {
        try {
            return Promise.resolve(this.interaction(actor));
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
