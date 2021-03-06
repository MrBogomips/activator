/**
 * Copyright (C) 2013 Typesafe <http://typesafe.com/>
 */
package console

import play.api.{ Logger, Plugin, Application }
import com.typesafe.config.Config
import akka.actor.{ PoisonPill, ActorRef, Props, ActorSystem }
import scala.util.control.NonFatal

class ConsolePlugin(app: Application) extends Plugin {
  private var env: ConsolePluginEnvironment = null
  def config = env.config
  def actorSystem = env.system
  def clientHandlerActor = env.clientHandlerActor

  override def onStart(): Unit = {
    require(env eq null)
    env = ConsolePluginEnvironment(app.configuration.underlying)
  }

  override def onStop(): Unit = {
    try {
      require(env ne null)
      env.close()
    } finally {
      env = null
    }
  }
}

private case class ConsolePluginEnvironment(config: Config, system: ActorSystem, clientHandlerActor: ActorRef) extends java.io.Closeable {
  override def close(): Unit = {
    try {
      clientHandlerActor ! PoisonPill
      system.shutdown()
      system.awaitTermination()
    } catch {
      case NonFatal(e) =>
        Logger.error("Failed to close actor system: ${e.getClass.getName}: ${e.getMessage}")
    }
  }
}

private object ConsolePluginEnvironment {
  def apply(config: Config): ConsolePluginEnvironment = {
    val system = ActorSystem("ConsoleActorSystem")
    val clientHandler = system.actorOf(Props[ClientController], "clientController")
    ConsolePluginEnvironment(config, system, clientHandler)
  }
}
