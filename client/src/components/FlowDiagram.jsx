import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import PageNode from './PageNode';

/**
 * Auto-layout nodes using the dagre graph layout algorithm.
 *
 * Dagre takes a list of nodes and edges and figures out where to
 * position each node so the graph looks clean — like a flowchart.
 * It arranges nodes top-to-bottom with parent nodes above children.
 */
function getLayoutedElements(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  // LR = left-to-right layout direction (horizontal flow chains)
  g.setGraph({
    rankdir: 'LR',
    nodesep: 40,   // Vertical spacing between nodes
    ranksep: 80,   // Horizontal spacing between ranks (columns)
    marginx: 20,
    marginy: 20,
  });

  // Add nodes to dagre (it needs width/height to calculate positions)
  for (const node of nodes) {
    g.setNode(node.id, { width: 220, height: 80 });
  }

  // Add edges to dagre
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  // Run the layout algorithm
  dagre.layout(g);

  // Apply calculated positions back to our nodes
  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - 110, // Center node (half of 220 width)
        y: pos.y - 40,   // Center node (half of 80 height)
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// Register our custom node type
const nodeTypes = { pageNode: PageNode };

export default function FlowDiagram({ flowData }) {
  // Transform backend data into React Flow format
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!flowData) return { initialNodes: [], initialEdges: [] };

    const rfNodes = flowData.nodes.map((node) => ({
      id: node.id,
      type: 'pageNode',
      data: {
        label: node.label,
        path: node.id,
        type: node.type,
        count: node.count,
      },
      position: { x: 0, y: 0 }, // Will be overridden by dagre
    }));

    const rfEdges = flowData.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label || undefined,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      labelStyle: { fontSize: 10, fill: '#94a3b8' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 16, height: 16 },
    }));

    // Apply auto-layout
    const layouted = getLayoutedElements(rfNodes, rfEdges);
    return { initialNodes: layouted.nodes, initialEdges: layouted.edges };
  }, [flowData]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  if (!flowData || flowData.nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        No flow data to display
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <h2 className="text-lg font-semibold text-gray-800">Detected User Flows</h2>
        {flowData?.stats && (
          <p className="text-xs text-gray-400 mt-0.5">
            {flowData.stats.totalNodes} nodes, {flowData.stats.totalEdges} connections
          </p>
        )}
      </div>
      <div className="flex-1">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Controls position="bottom-left" />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            const colors = {
              home: '#93c5fd', listing: '#86efac', detail: '#fcd34d',
              auth: '#c4b5fd', cart: '#fda4af', checkout: '#fda4af',
              search: '#67e8f9', info: '#cbd5e1', support: '#5eead4',
            };
            return colors[node.data?.type] || '#e5e7eb';
          }}
          maskColor="rgba(255, 255, 255, 0.7)"
        />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
      </ReactFlow>
      </div>
    </div>
  );
}
