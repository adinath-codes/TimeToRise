"""
Archestra Deployment Script
Automatically generated on 2026-02-14T17:34:46.923Z
"""
from archestra import ArchestraRegistry, ArchestraOrchestrator
import sys
import os

# Ensure studio path is importable
sys.path.append(os.path.join(os.getcwd(), 'studio'))

# 1. Initialize Registry
registry = ArchestraRegistry(name="TimeToRise-Registry")

# 2. Import and Register Nodes
import mcp_postgres_db_60
registry.add_server(id="mcp-1771089744760", node=mcp_postgres_db_60.get_node())
import mcp_postgres_db_2_08
registry.add_server(id="mcp-1771090152608", node=mcp_postgres_db_2_08.get_node())
import provider_archestra_gateway_36
registry.add_provider(id="provider-1771090157536", node=provider_archestra_gateway_36.get_node(registry))
import mcp_postgres_db_3_67
registry.add_server(id="mcp-1771090344767", node=mcp_postgres_db_3_67.get_node())
import mcp_file_system_11
registry.add_server(id="mcp-1771090354111", node=mcp_file_system_11.get_node())

# 3. Setup Orchestrator and Flows
orchestrator = ArchestraOrchestrator(name="MainOrchestrator")

# Configure Flows based on UI connections

if __name__ == "__main__":
    print("Deploying Archestra Studio Architecture from individual node files...")
    orchestrator.deploy()
