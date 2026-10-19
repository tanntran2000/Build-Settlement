<script lang="ts">
  import { errorLog } from './error-log.js';
</script>

<section class="card error-log" lang="en" aria-label="Error log">
  <h2>Error log</h2>
  <p>Up to five recent groups, oldest to newest. Stored in this browser when available. Nothing is sent automatically.</p>
  {#if $errorLog.persistence === 'ram-only'}
    <p role="alert">Not saved — this tab only. Download before closing.</p>
  {:else if $errorLog.persistence === 'pending'}
    <p role="status">Saving recent errors…</p>
  {:else if $errorLog.persistence === 'saved'}
    <p>Saved locally in this browser.</p>
  {/if}
  {#if $errorLog.discarded}<p role="alert">Stored error log was invalid and has been discarded.</p>{/if}
  {#if $errorLog.download === 'failed'}
    <p role="alert">Unable to request download. Your error log is unchanged.</p>
  {:else if $errorLog.download === 'requested'}
    <p role="status">Download requested.</p>
  {/if}
  {#if $errorLog.entries.length === 0}
    <p>No errors recorded.</p>
  {:else}
    <ol aria-label="Recorded errors">
      {#each $errorLog.entries as entry}
        <li>
          <p><strong>{entry.kind} · {entry.code}</strong></p>
          <p>{entry.message}</p>
          <p>{entry.mode} · {entry.action} · {#if entry.clock}{#if 'day' in entry.clock}Day {entry.clock.day} · {/if}Week {entry.clock.week}{#if 'year' in entry.clock} · Year {entry.clock.year}{/if}{:else}Clock unavailable{/if}</p>
          <p>First UTC: <time datetime={entry.timestampUtc}>{entry.timestampUtc}</time><br />Last UTC: <time datetime={entry.lastSeenUtc}>{entry.lastSeenUtc}</time></p>
          <p>Occurrences: {entry.occurrences} · App version: {entry.appVersion} · Build unavailable</p>
        </li>
      {/each}
    </ol>
  {/if}
  <button type="button" onclick={() => errorLog.download()} disabled={$errorLog.entries.length === 0}>Download error log</button>
  <p>Only a file you choose to share can be reviewed. This log contains no save snapshot or stack trace.</p>
</section>

<style>
  .error-log { margin-top: 24px; overflow-wrap: anywhere; }
  h2 { margin-top: 0; }
  p { line-height: 1.5; }
  ol { padding-left: 24px; }
  li { padding: 8px 0; border-top: 1px solid currentColor; }
  li p { margin: 6px 0; }
</style>
