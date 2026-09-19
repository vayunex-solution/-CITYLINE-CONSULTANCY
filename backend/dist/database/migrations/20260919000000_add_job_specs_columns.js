"use strict";
/**
 * CITYLINE CONSULTANCY — Add Job Specifications (Visa Sponsorship & Work Shift)
 * Additive migration supporting rich job specs ribbon fields.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    const hasVisa = await knex.schema.hasColumn('jobs', 'visa_sponsorship');
    if (!hasVisa) {
        await knex.schema.alterTable('jobs', (table) => {
            table.string('visa_sponsorship', 150).nullable().defaultTo('2-Year UAE Employment Visa');
        });
    }
    const hasShift = await knex.schema.hasColumn('jobs', 'work_shift');
    if (!hasShift) {
        await knex.schema.alterTable('jobs', (table) => {
            table.string('work_shift', 150).nullable().defaultTo('8 Hrs/Day + Overtime (UAE Law)');
        });
    }
}
async function down(knex) {
    const hasVisa = await knex.schema.hasColumn('jobs', 'visa_sponsorship');
    if (hasVisa) {
        await knex.schema.alterTable('jobs', (table) => {
            table.dropColumn('visa_sponsorship');
        });
    }
    const hasShift = await knex.schema.hasColumn('jobs', 'work_shift');
    if (hasShift) {
        await knex.schema.alterTable('jobs', (table) => {
            table.dropColumn('work_shift');
        });
    }
}
