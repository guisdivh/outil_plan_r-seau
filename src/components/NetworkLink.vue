<script setup>
import { computed } from 'vue'
import { usePlanStore } from '../stores/plan'

const props = defineProps({
  link: { type: Object, required: true },
})

const store = usePlanStore()

const source = computed(() => store.nodes.find((n) => n.id === props.link.sourceId))
const target = computed(() => store.nodes.find((n) => n.id === props.link.targetId))
</script>

<template>
  <line
    v-if="source && target"
    :x1="source.x"
    :y1="source.y"
    :x2="target.x"
    :y2="target.y"
    class="network-link"
  />
</template>

<style scoped>
.network-link {
  stroke: #64748b;
  stroke-width: 2;
}
</style>
